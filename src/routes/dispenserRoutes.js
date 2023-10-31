const express = require("express");
const router = express.Router();

const { v4: uuidv4 } = require("uuid");

// In-memory data storage for dispensers and tap events
// TODO: (replace with a database). Possibly MongoDB Atlas or Firestore from Firebase
const dispensers = [];
const tapEvents = [];

router.use(express.json());

router.post("/dispensers", (req, res) => {
  if (!req.body || !req.body.flowVolume) {
    return res
      .status(400)
      .json({
        error: 'Invalid request. The "flowVolume" property is missing.',
      });
  }
  const { flowVolume } = req.body;
  const dispenserId = uuidv4();
  const dispenser = { id: dispenserId, flowVolume };
  dispensers.push(dispenser);
  res.json({ dispenser_id: dispenserId });
});

router.put("/dispensers/:dispenserId/status", (req, res) => {
  const { dispenserId } = req.params;
  const dispenser = dispensers.find((d) => d.id === dispenserId);

  if (!dispenser) {
    return res.status(404).json({ error: "Dispenser not found" });
  }

  const { status } = req.body;

  if (status !== "open" && status !== "close") {
    return res
      .status(400)
      .json({ error: 'Invalid status. Use "open" or "close".' });
  }

  if (status === "open") {
    // Open the tap and record the tap event
    const tapEvent = { dispenserId, status: "open", start_time: new Date() };
    tapEvents.push(tapEvent);

    res.json({ status: "open", start_time: tapEvent.start_time });
  } else {
    // Close the tap and calculate revenue
    const openTapEvent = tapEvents.find(
      (event) => event.dispenserId === dispenserId && event.status === "open"
    );

    if (!openTapEvent) {
      return res.status(400).json({ error: "No open tap event found" });
    }

    // Calculate revenue based on the time the tap was open
    const endTime = new Date();
    const durationInSeconds = (endTime - openTapEvent.start_time) / 1000;
    const revenue = (dispenser.flowVolume * durationInSeconds).toFixed(2);

    // Record the tap event as closed
    openTapEvent.status = "closed";
    openTapEvent.end_time = endTime;

    res.json({ status: "closed", end_time: openTapEvent.end_time, revenue });
  }
});

// Route to get the money spent by a specific dispenser, breaking down by uses
router.get("/dispensers/:id/spending", (req, res) => {
  const dispenserId = req.params.id;

  const dispenser = dispensers.find(
    (dispenser) => dispenser.id === dispenserId
  );

  if (!dispenser) {
    return res.status(404).json({ error: "Dispenser not found" });
  }

  // Calculate spending for each use, including open taps
  const spendingDetails = tapEvents
    .filter((event) => event.dispenserId === dispenserId)
    .map((event) => {
      const openedAt = event.start_time;
      const closedAt = event.end_time;
      const flowVolume = event.flowVolume;

      if (openedAt) {
        const endTime = closedAt || new Date();
        const durationInSeconds = (endTime - openedAt) / 1000;
        const totalSpent = (flowVolume * durationInSeconds * 12.25).toFixed(2);

        return {
          opened_at: openedAt.toISOString(),
          closed_at: closedAt ? closedAt.toISOString() : null,
          flow_volume: flowVolume,
          total_spent: `$${totalSpent}`,
        };
      } else {
        return {
          opened_at: null,
          closed_at: null,
          flow_volume: flowVolume,
          total_spent: "$0.00",
        };
      }
    });

  const totalAmount = parseFloat(
    spendingDetails
      .reduce(
        (total, use) => total + parseFloat(use.total_spent.replace("$", "")),
        0
      )
      .toFixed(2)
  );

  const response = {
    amount: `$${totalAmount}`,
    usages: spendingDetails,
  };

  res.json(response);
});

module.exports = router;
