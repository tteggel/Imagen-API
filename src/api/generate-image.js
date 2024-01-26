import axios from 'axios'
import {VITE_GOOGLE_PROJECT_ID} from '../constants.js'
import {GoogleAuth} from 'google-auth-library'
import express from 'express'

const auth = new GoogleAuth({scopes: 'https://www.googleapis.com/auth/cloud-platform'})

export const POST = (req, res, next) => {
    generateImages(req.body).then(image => res.send(image), err => res.status(400).send(err.response.data))
}

const generateImages = async ({prompt}) => {
    const token = await auth.getAccessToken()
    try {
        const res = await axios.post(`https://us-central1-aiplatform.googleapis.com/v1/projects/${VITE_GOOGLE_PROJECT_ID}/locations/us-central1/publishers/google/models/imagegeneration:predict`,

            {
                instances: [
                    {
                        prompt: prompt
                    }
                ],
                parameters: {
                    sampleCount: 1
                }
            },

            {
                headers:{
                    Authorization:`Bearer ${token}`
                }
            }
        )
        return res.data.predictions[0].bytesBase64Encoded
    }
    catch(err){
        console.log(err.response.data)
        throw err
    }
}

export default [express.json()]
