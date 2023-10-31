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
    return res.status(400).json({ error: 'Invalid request. The "flowVolume" property is missing.' });
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

router.get('/dispensers/summary', (req, res) => {
    const dispenserSummary = dispensers.map((dispenser) => {
      const usageCount = tapEvents.reduce((count, event) => {
        if (event.dispenserId === dispenser.id && event.status === 'closed') {
          return count + 1;
        }
        return count;
      }, 0);

      const totalDuration = tapEvents.reduce((total, event) => {
        if (event.dispenserId === dispenser.id && event.status === 'closed') {
          return total + (event.end_time - event.start_time);
        }
        return total;
      }, 0);

      const revenue = (dispenser.flowVolume * (totalDuration / 1000)).toFixed(2);

      return {
        dispenser_id: dispenser.id,
        usage_count: usageCount,
        total_duration: `${(totalDuration / 1000).toFixed(2)} seconds`,
        total_revenue: `$${revenue}`,
      };
    });

    res.json(dispenserSummary);
  });


module.exports = router;