import express from "express"
import {GoogleAuth} from "google-auth-library"
import {configDotenv} from "dotenv"

configDotenv()

const port = process.env.PORT ?? 3001
const auth = new GoogleAuth()

const app = express()
const router = express.Router()

router.use(express.json({limit: "500mb"}))
router.use(express.urlencoded({ extended: true, limit: "500mb" }))

router.use(express.static("dist"))

router.post("/api/generate-image", (req, res) => {
    generateImages(req.body).then(image => res.send(image), err => res.status(400).send(err?.response?.data ?? err))
})

app.use('/imagen2', router)
app.use('/', router)

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`)
})

const generateImages = async (instance) => {
    const token = await auth.getAccessToken()

    const res = await fetch(`https://us-central1-aiplatform.googleapis.com/v1/projects/${process.env.VITE_GOOGLE_PROJECT_ID}/locations/us-central1/publishers/google/models/imagegeneration@005:predict`,
    {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization:`Bearer ${token}`,
        },
        body: JSON.stringify({
            instances: [
                instance
            ],
            parameters: {
                sampleCount: 1
            }
        })
    })
    if (!res.ok) throw new Error().stack = await res.text()
    const body = await res.json()
    return body.predictions[0].bytesBase64Encoded
}
