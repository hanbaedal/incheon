"use strict";

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "family"], required: true, index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true, default: "" },
    // 상주(family) 계정이 연결된 빈소
    hallId: { type: mongoose.Schema.Types.ObjectId, ref: "Hall", default: null },
    active: { type: Boolean, default: true },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true }
);

userSchema.methods.setPassword = async function setPassword(plain) {
  this.passwordHash = await bcrypt.hash(plain, 10);
};

userSchema.methods.verifyPassword = function verifyPassword(plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id,
    username: this.username,
    role: this.role,
    name: this.name,
    phone: this.phone,
    hallId: this.hallId,
    active: this.active,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
