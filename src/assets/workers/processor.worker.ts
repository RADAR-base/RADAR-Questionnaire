/// <reference lib="webworker" />

(() => {
  const HEALTHKIT_QUERY_INTERVAL = 100

  function validateData(data) {
    if (!data) return false
    if (!data.answers) return false
    return true
  }

  function compressData(data) {
    // Ensure data is an array
    if (!Array.isArray(data)) {
      return data
    }
    // Remove null/undefined values from array
    return data.filter(item => item !== null && item !== undefined)
  }

  function calculateDurationInDays(startTime, endTime) {
    return (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60 * 24)
  }

  function reportProgress(progress) {
    postMessage({
      type: 'progress',
      data: progress
    })
  }

  function processHealthData(data) {
    const dividedObjects = []
    const validEntries = Object.entries(data.answers)

    validEntries.forEach(([key, value]) => {
      const startTime = value['startTime']
      const endTime = value['endTime']
      const durationInDays = calculateDurationInDays(startTime, endTime)

      if (durationInDays <= HEALTHKIT_QUERY_INTERVAL) {
        dividedObjects.push({
          type: 'HEALTHKIT',
          value: {
            time: data.time,
            timeCompleted: data.timeCompleted,
            key,
            value
          }
        })
      } else {
        const numberOfObjects = Math.ceil(durationInDays / HEALTHKIT_QUERY_INTERVAL)
        const interval = durationInDays / numberOfObjects
        let currentStartTime = startTime.getTime()

        for (let i = 0; i < numberOfObjects; i++) {
          const currentEndTime = new Date(currentStartTime + (interval * 24 * 60 * 60 * 1000))
          const currentValue = {
            startTime: new Date(currentStartTime),
            endTime: currentEndTime > endTime ? endTime : currentEndTime
          }
          dividedObjects.push({
            type: 'HEALTHKIT',
            value: {
              time: data.time,
              timeCompleted: data.timeCompleted,
              key,
              value: currentValue
            }
          })
          currentStartTime = currentEndTime.getTime()
        }
      }
    })

    return dividedObjects
  }

  function processQuestionnaireData(data) {
    const kafkaObjects = []
    const validEntries = Object.entries(data.answers)

    validEntries.forEach(([key, value]) => {
      kafkaObjects.push({
        type: 'QUESTIONNAIRE',
        value: {
          time: data.time,
          timeCompleted: data.timeCompleted,
          key,
          value
        }
      })
    })

    return kafkaObjects
  }

  addEventListener('message', ({ data }) => {
    const { type, task, healthData, questionnaireData, assessmentMetadata } = data

    try {
      // Validate input data
      reportProgress({ stage: 'validation', progress: 0, total: 1 })

      let inputData
      if (type === 'health') {
        inputData = healthData
      } else {
        inputData = questionnaireData
      }

      if (!validateData(inputData)) {
        throw new Error(`Invalid ${type} data`)
      }
      reportProgress({ stage: 'validation', progress: 1, total: 1 })

      // Process data
      reportProgress({ stage: 'processing', progress: 0, total: 1 })
      const kafkaObjects = type === 'health'
        ? processHealthData(inputData)
        : processQuestionnaireData(inputData)
      reportProgress({ stage: 'processing', progress: 1, total: 1 })

      // Report compression stage
      reportProgress({ stage: 'compression', progress: 0, total: 1 })
      const compressedData = compressData(kafkaObjects)
      reportProgress({ stage: 'compression', progress: 1, total: 1 })

      // Report completion
      reportProgress({ stage: 'complete', progress: 1, total: 1 })

      // Post results back to the main thread
      postMessage({
        type: 'complete',
        success: true,
        data: {
          kafkaObjects: compressedData
        }
      })
    } catch (error) {
      postMessage({
        type: 'error',
        success: false,
        error: error.message
      })
    }
  })
})()