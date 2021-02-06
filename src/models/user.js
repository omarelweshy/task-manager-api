const mongoose = require("mongoose")
const validator = require("validator")
const bycrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const Task = require("./task")
const { Timestamp } = require("mongodb")

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) throw new Error("Email is valid")
      },
    },
    password: {
      type: String,
      required: true,
      tirm: true,
      minlength: 7,
      validate(value) {
        if (value.includes("password"))
          throw new Error("Password shouldn't include 'password'")
      },
    },
    age: {
      type: Number,
      default: 0,
      validate(value) {
        if (value < 0) throw new Error("Age must me a positve number")
      },
    },
    tokens: [
      {
        token: {
          type: String,
          required: true,
        },
      },
    ],
    avatar: {
      type: Buffer,
    },
  },
  { timestamps: true }
)

userSchema.virtual("tasks", {
  ref: "Task",
  localField: "_id",
  foreignField: "owner",
})

userSchema.methods.generateAuthToken = async function () {
  const user = this
  const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET)

  user.tokens = user.tokens.concat({ token })
  await user.save()

  return token
}

userSchema.methods.toJSON = function () {
  const user = this
  const userObject = user.toObject()

  delete userObject.password
  delete userObject.token
  delete userObject.avatar

  return userObject
}

userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email })

  if (!user) throw new Error("Unable to login")

  const isMatch = await bycrypt.compare(password, user.password)

  if (!isMatch) throw new Error("Unable to login")

  return user
}

// hash the password
userSchema.pre("save", async function (next) {
  const user = this

  if (user.isModified("password")) {
    user.password = await bycrypt.hash(user.password, 8)
  }

  next()
})

userSchema.pre("remove", async function (next) {
  const user = this

  await Task.deleteMany({ owner: user._id })

  next()
})

const User = mongoose.model("User", userSchema)

module.exports = User
