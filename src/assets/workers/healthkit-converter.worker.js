/// <reference lib="webworker" />

addEventListener('message', ({ data }) => {
  const { key, inputData, timeReceived, type, valueKey } = data

  const results = inputData.map(d =>
    Object.assign(
      {},
      {
        time: Math.floor(new Date(d.startDate).getTime() / 1000),
        endTime: Math.floor(new Date(d.endDate).getTime() / 1000),
        timeReceived: timeReceived,
        sourceId: d.sourceBundleId,
        sourceName: d.device
          ? `${d.device.manufacturer} ${d.device.model} ${d.device.hardwareVersion}`
          : d.source,
        unit: d.unitName ?? '',
        key,
        intValue: null,
        floatValue: null,
        doubleValue: null,
        stringValue: null
      },
      { [type]: d[valueKey] }
    )
  )

  // Post results back to the main thread
  postMessage(results)
})
