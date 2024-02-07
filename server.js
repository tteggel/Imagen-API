import express from "express"
import {GoogleAuth} from "google-auth-library"
import {configDotenv} from "dotenv"
import {join as pathJoin} from "path"

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

router.post("/api/generate-text", (req, res) => {
    generateText(req.body).then(image => res.send(image), err => res.status(400).send(err?.response?.data ?? err))
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

    const version = rq?.instances?.some((instance)=>instance?.image !== undefined) ?? false ? "002" : "005"

    const rs = await fetch(`https://us-central1-aiplatform.googleapis.com/v1/projects/${process.env.GOOGLE_CLOUD_PROJECT}/locations/us-central1/publishers/google/models/imagegeneration@${version}:predict`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization:`Bearer ${token}`,
            },
            body: JSON.stringify(rq)
        }
    )
    if (!rs.ok) throw new Error().stack = await rs.text()

    const body = await rs.json()

    if ((body?.predictions?.length ?? 0) === 0) throw new Error().stack = "Response from Google contained no images."

    return body.predictions
}

const needsVisionModel = (rq) => {
    return rq.contents.some(content => content.parts.some(part => part.inlineData !== undefined)) ? "-vision" : ""
}

const generateText = async (rq) => {
    const token = await auth.getAccessToken()

    const rs = await fetch(`https://us-central1-aiplatform.googleapis.com/v1/projects/${process.env.GOOGLE_CLOUD_PROJECT}/locations/us-central1/publishers/google/models/gemini-pro${needsVisionModel(rq)}:streamGenerateContent?alt=sse`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
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
