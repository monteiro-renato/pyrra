import {PromiseClient} from '@bufbuild/connect-web'
import {PrometheusService} from '../../proto/prometheus/v1/prometheus_connectweb'
import uPlot from 'uplot'
import React, {useLayoutEffect, useRef, useState} from 'react'
import {usePrometheusQueryRange} from '../../prometheus'
import {step} from './step'
import UplotReact from 'uplot-react'
import {AlignedDataResponse, convertAlignedData, mergeAlignedData} from './aligneddata'
import {Spinner} from 'react-bootstrap'
import {seriesGaps} from './gaps'
import {blues, reds} from './colors'

interface BurnrateGraphProps {
  client: PromiseClient<typeof PrometheusService>
  short: string
  long: string
  threshold: number
  from: number
  to: number
  uPlotCursor: uPlot.Cursor
}

const BurnrateGraph = ({
  client,
  short,
  threshold,
  long,
  from,
  to,
  uPlotCursor,
}: BurnrateGraphProps): JSX.Element => {
  const targetRef = useRef() as React.MutableRefObject<HTMLDivElement>

  const [width, setWidth] = useState<number>(500)

  const setWidthFromContainer = () => {
    if (targetRef?.current !== undefined && targetRef?.current !== null) {
      setWidth(targetRef.current.offsetWidth)
    }
  }

  // Set width on first render
  useLayoutEffect(setWidthFromContainer)
  // Set width on every window resize
  window.addEventListener('resize', setWidthFromContainer)

  const {response: shortResponse, status: shortStatus} = usePrometheusQueryRange(
    client,
    short,
    from / 1000,
    to / 1000,
    step(from, to),
  )

  const {response: longResponse, status: longStatus} = usePrometheusQueryRange(
    client,
    long,
    from / 1000,
    to / 1000,
    step(from, to),
  )

  // TODO: Improve to show graph if one is succeeded already
  if (
    shortStatus === 'loading' ||
    shortStatus === 'idle' ||
    longStatus === 'loading' ||
    longStatus === 'idle'
  ) {
    return (
      <div style={{display: 'flex', alignItems: 'baseline', justifyContent: 'space-between'}}>
        <h4 className="graphs-headline">
          Errors
          <Spinner
            animation="border"
            style={{
              marginLeft: '1rem',
              marginBottom: '0.5rem',
              width: '1rem',
              height: '1rem',
              borderWidth: '1px',
            }}
          />
        </h4>
      </div>
    )
  }

  const shortData = convertAlignedData(shortResponse)
  const longData = convertAlignedData(longResponse)

  const responses: AlignedDataResponse[] = []
  if (shortData !== null) {
    responses.push(shortData)
  }
  if (longData !== null) {
    responses.push(longData)
  }

  const {data: mergedData} = mergeAlignedData(responses)
  const data = [...mergedData, Array(mergedData[0].length).fill(threshold)]

  // no data
  if (data[0].length === 0) {
    return (
      <div ref={targetRef} className="burnrate">
        <h5 className="graphs-headline">Burnrate</h5>
        <UplotReact
          options={{
            width: width - (2 * 10 + 2 * 15), // margin and padding
            height: 150,
            padding: [15, 0, 0, 0],
            cursor: uPlotCursor,
            series: [
              {},
              {
                min: 0,
                label: 'short',
                gaps: seriesGaps(from / 1000, to / 1000),
                stroke: `#${reds[1]}`,
              },
              {
                min: 0,
                label: 'long',
                gaps: seriesGaps(from / 1000, to / 1000),
                stroke: `#${reds[2]}`,
              },
              {
                label: 'threshold',
                stroke: `#${blues[0]}`,
              },
            ],
            scales: {
              x: {min: from / 1000, max: to / 1000},
            },
          }}
          data={[[], [], [], []]}
        />
      </div>
    )
  }

  return (
    <div ref={targetRef} className="burnrate">
      <h5 className="graphs-headline">Burnrate</h5>
      <UplotReact
        options={{
          width: width - (2 * 10 + 2 * 15), // margin and padding
          height: 150,
          padding: [15, 0, 0, 0],
          cursor: uPlotCursor,
          series: [
            {},
            {
              min: 0,
              label: 'short',
              gaps: seriesGaps(from / 1000, to / 1000),
              stroke: `#${reds[1]}`,
            },
            {
              min: 0,
              label: 'long',
              gaps: seriesGaps(from / 1000, to / 1000),
              stroke: `#${reds[2]}`,
            },
            {
              label: 'threshold',
              stroke: `#${blues[0]}`,
            },
          ],
          scales: {
            x: {min: from / 1000, max: to / 1000},
          },
        }}
        data={data}
      />
    </div>
  )
}

export default BurnrateGraph
