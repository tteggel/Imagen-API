import express from "express"
import {GoogleAuth} from "google-auth-library"
import {configDotenv} from "dotenv"
import {VertexAI} from "@google-cloud/vertexai"

configDotenv()

const port = process.env.PORT ?? 3001
const auth = new GoogleAuth()
const vertexAI = new VertexAI({project: process.env.VITE_GOOGLE_PROJECT_ID, location: "us-central1"})

const app = express()
const router = express.Router()

router.use(express.json({limit: "500mb"}))
router.use(express.urlencoded({ extended: true, limit: "500mb" }))

router.use(express.static("dist"))

router.post("/api/generate-image", (req, res) => {
    generateImages(req.body).then(image => res.send(image), err => res.status(400).send(err?.response?.data ?? err))
})

router.post("/api/generate-text", (req, res) => {
    generateText(req.body).then(image => res.send(image), err => res.status(400).send(err?.response?.data ?? err))
})

app.use('/imagen2', router)
app.use('/', router)

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`)
})

const generateImages = async (rq) => {
    const token = await auth.getAccessToken()

    const rs = await fetch(`https://us-central1-aiplatform.googleapis.com/v1/projects/${process.env.VITE_GOOGLE_PROJECT_ID}/locations/us-central1/publishers/google/models/imagegeneration@005:predict`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization:`Bearer ${token}`,
            },
            body: JSON.stringify(rq)
        })
    if (!rs.ok) throw new Error().stack = await res.text()

    const body = await rs.json()
    if (body?.predictions?.[0]?.bytesBase64Encoded === undefined) throw new Error().stack = "Response from Google contained no images."

    return body.predictions[0].bytesBase64Encoded
}

const generateText = async (instance) => {
    try {
        const model = vertexAI.preview.getGenerativeModel({model: "gemini-pro-vision"})
        const rq = {
            contents: [
                {role: "user", parts: [{text: instance.prompt}]}
            ]
        }
        const rs = await model.generateContent(rq)
        return rs.response
    }catch (e) {console.log(e)}
}
