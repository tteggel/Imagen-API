import express from "express"
import compression from "compression"
import {GoogleAuth} from "google-auth-library"
import {configDotenv} from "dotenv"
import {join as pathJoin} from "path"

configDotenv()

const port = process.env.PORT ?? 3001
const auth = new GoogleAuth()

const app = express()
const router = express.Router()

// Enable gzip compression
router.use(compression({
  level: 9, // compression level (1-9, where 9 is best compression)
  threshold: 1024, // only compress responses larger than 1KB
  filter: (req, res) => {
    // compress all responses by default
    return compression.filter(req, res)
  }
}))

router.use(express.json({limit: "500mb"}))
router.use(express.urlencoded({ extended: true, limit: "500mb" }))

router.use(express.static("dist"))

router.post("/api/generate-image", (req, res) => {
  generateImages(req.body).then(image => res.send(image), err => res.status(400).send(err?.response?.data ?? err))
})

router.post("/api/generate-text", (req, res) => {
  generateText(req.body).then(image => res.send(image), err => res.status(400).send(err?.response?.data ?? err))
})

router.post("/api/assess-image", (req, res) => {
  assessImage(req.body).then(result => res.send(result), err => res.status(400).send(err?.response?.data ?? err))
})

router.get('/*', (req, res) => {
  res.sendFile(pathJoin(import.meta.dirname, '/dist/index.html'))
})

app.use('/ai', router)
app.use('/', router)

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`)
})

const generateImages = async (rq) => {
  const token = await auth.getAccessToken()

  const version = rq?.parameters?.editMode ? "imagen-3.0-capability-001"  : `imagen-4.0-generate-preview-05-20`
  delete rq.fast

  const rs = await fetch(`https://us-central1-aiplatform.googleapis.com/v1/projects/${process.env.GOOGLE_CLOUD_PROJECT}/locations/us-central1/publishers/google/models/${version}:predict`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept-Encoding": "gzip, deflate, br",
        Authorization:`Bearer ${token}`,
      },
      body: JSON.stringify(rq)
    }
  )
  if (!rs.ok) throw new Error().stack = await rs.text()

  const body = await rs.json()

  if ((body?.predictions?.length ?? 0) === 0) throw new Error().stack = "Response from Google contained no images."

  console.log(body.predictions.map(p => p.safetyAttributes))

  return body.predictions
}

const generateText = async (rq) => {
  const token = await auth.getAccessToken()

  const modelId = "gemini-2.5-pro-preview-03-25"

  const rs = await fetch(`https://us-central1-aiplatform.googleapis.com/v1/projects/${process.env.GOOGLE_CLOUD_PROJECT}/locations/us-central1/publishers/google/models/${modelId}:streamGenerateContent?alt=sse`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept-Encoding": "gzip, deflate, br",
        Authorization:`Bearer ${token}`,
      },
      body: JSON.stringify(rq)
    }
  )

  if (!rs.ok) throw new Error().stack = await rs.text()

  try {
    const raw = await rs.text()
    const lines = raw.split("\r\n")
    const trimmed = lines.map(line => line.slice(6)).filter(line => line.length > 0)
    const jsons = trimmed.map(trim => JSON.parse(trim))
    return {role:"model", parts: [{text:jsons.reduce((p, c) => p + (c?.candidates?.[0]?.content?.parts?.[0]?.text ?? ""), "")}]}
  }
  catch (err) {
    console.log(err)
    throw new Error().stack = err.message
  }
}

const assessImage = async (rq) => {
  const token = await auth.getAccessToken()

  const rs = await fetch(`https://europe-west2-aiplatform.googleapis.com/v1/projects/${process.env.GOOGLE_CLOUD_PROJECT}/locations/europe-west2/endpoints/${process.env.SHIELDGEMMA_ENDPOINT_ID}:predict`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept-Encoding": "gzip, deflate, br",
        Authorization:`Bearer ${token}`,
      },
      body: JSON.stringify(rq)
    }
  )
  
  if (!rs.ok) throw new Error().stack = await rs.text()

  const body = await rs.json()
  console.log(JSON.stringify(rq.instances[0].bytesBase64Encoded.length, null, 2))
  return body
}
