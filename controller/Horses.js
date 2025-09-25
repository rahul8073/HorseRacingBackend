const Horses = require('../Models/Horses');

// Create new horse
exports.CreateHorse = async (req, res) => {
    try {
        let horsesData = req.body;

        // If it's a single object, wrap it in an array
        if (!Array.isArray(horsesData)) {
            horsesData = [horsesData];
        }

        // Validation: check all entries have ID and horseName
        for (const horse of horsesData) {
            if (!horse.horseNumber || !horse.horseName) {
                return res.status(400).json({ message: "Each horse must have ID and horseName" });
            }
        }

        // Check for duplicate IDs in DB
        const ids = horsesData.map(h => h.ID);
        const existingHorses = await Horses.find({ ID: { $in: ids } });
        if (existingHorses.length > 0) {
            const existingIDs = existingHorses.map(h => h.horseNumber);
            return res.status(400).json({ 
                message: "Some horseNumber already exist", 
                existingIDs 
            });
        }

        // Insert horses
        const newHorses = await Horses.insertMany(horsesData);

        res.status(201).json({ 
            message: "Horses created successfully", 
            horses: newHorses 
        });

    } catch (error) {
        console.error("Error creating horses:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};


// Get all horses
exports.GetAllHorses = async (req, res) => {
    try {
        const horses = await Horses.find().sort({ createdAt: -1 });
        res.status(200).json(horses);

    } catch (error) {
        console.error("Error fetching horses:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get horse by MongoDB _id
exports.GetHorseById = async (req, res) => {
    try {
        const horse = await Horses.findById(req.params.id);
        if (!horse) {
            return res.status(404).json({ message: "Horse not found" });
        }
        res.status(200).json(horse);

    } catch (error) {
        console.error("Error fetching horse:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Update horse
exports.UpdateHorse = async (req, res) => {
    try {
        const { ID, horseName } = req.body;

        const updatedHorse = await Horses.findByIdAndUpdate(
            req.params.id,
            { horseNumber, horseName },
            { new: true, runValidators: true }
        );

        if (!updatedHorse) {
            return res.status(404).json({ message: "Horse not found" });
        }

        res.status(200).json({ message: "Horse updated successfully", horse: updatedHorse });

    } catch (error) {
        console.error("Error updating horse:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Delete horse
exports.deleteHorse = async (req, res) => {
    try {
        const { id, ids } = req.body; // single id or multiple ids

        if (id) {
            // Single delete
            const deletedHorse = await Horses.findByIdAndDelete(id);
            if (!deletedHorse) {
                return res.status(404).json({ message: "Horse not found" });
            }
            return res.status(200).json({ message: "Horse deleted successfully" });
        } 
        
        if (ids && Array.isArray(ids) && ids.length > 0) {
            // Bulk delete
            const result = await Horses.deleteMany({ _id: { $in: ids } });
            return res.status(200).json({
                message: `${result.deletedCount} horse(s) deleted successfully`,
            });
        }

        return res.status(400).json({ message: "Please provide id or ids" });

    } catch (error) {
        console.error("Error deleting horse:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

