import User from "../models/userModel.js";

export const getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params;
    const validRoles = ["student", "professor"];

    if (!validRoles.includes(role))
      return res.status(400).json({ message: "Invalid role" });

    const users = await User.find({ role }).select("-password");
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
