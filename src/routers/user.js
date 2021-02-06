const express = require("express")
const router = new express.Router()
const auth = require("../middleware/auth")
const User = require("../models/user")
const { sendWelcomeEmail, sendCancelationEmail } = require("../emails/account")
const multer = require("multer")
const sharp = require("sharp")

router.post("/users", async (req, res) => {
  const user = new User(req.body)
  try {
    await user.save()
    sendWelcomeEmail(user.email, user.name)
    const token = await user.generateAuthToken()
    res.status(201).send({ user, token })
  } catch (error) {
    res.status(400).send()
  }
})

router.post("/users/login", async (req, res) => {
  try {
    const user = await User.findByCredentials(req.body.email, req.body.password)
    const token = await user.generateAuthToken()
    res.send({ user: user.getPublicProfile(), token })
  } catch (error) {
    res.status(400).send()
  }
})

router.post("/users/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token
    })
    await req.user.save()

    res.send()
  } catch (error) {
    res.status(500).send()
  }
})

router.post("users/logoutAll", auth, async (req, res) => {
  try {
    req.user.tokens = []
    await req.user.save()
    res.send()
  } catch (error) {
    res.status(500).send()
  }
})

router.get("/user/me", auth, async (req, res) => {
  res.send(req.user)
})

router.patch("/user/me", auth, async (req, res) => {
  const updates = Object.keys(req.body)
  const allowedUpdates = ["name", "email", "password", "age"]
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  )

  if (!isValidOperation) res.status(400).send({ error: "Invaild Updates" })

  try {
    updates.forEach((update) => (req.user[update] = req.body[update]))

    await req.user.save()

    res.send(req.user)
  } catch (e) {
    res.status(400).send()
  }
})

router.delete("/user/me", auth, async (req, res) => {
  try {
    await req.user.remove()
    sendCancelationEmail(req.user.email, req.user.name)
    res.send(req.user)
  } catch (error) {
    res.status(400).send()
  }
})

const upload = multer({
  limits: {
    fileSize: 1000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      cb(new Error("File must be jpg, jpeg or png"))
    }
    cb(undefined, true)
  },
})

router.post(
  "/user/me/avatar",
  auth,
  upload.single("avatar"),
  async (req, res) => {
    const buffer = await sharp(req.file.buffer)
      .resize({ width: 250, height: 250 })
      .png()
      .toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send()
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message })
  }
)

router.delete("/user/me/avatar", auth, async (req, res) => {
  req.user.avatar = undefined
  await req.user.save()
  res.send()
})

router.get("/user/:id/avatar", async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user || !user.avatar) {
      throw new Error()
    }

    res.set("Content-Type", "image/png")
    res.send(user.avatar)
  } catch (error) {
    res.status(404).send()
  }
})

module.exports = router
