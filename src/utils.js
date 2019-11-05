import {
  scale,
  translate,
  transform,
  inverse,
  applyToPoint
} from 'transformation-matrix'

export const fromSceneToDom = (sceneCTM, currentMatrix, scenePoint) => {
  const transformedPoint = applyToPoint(
    currentMatrix, scenePoint
  )
  return applyToPoint(sceneCTM, transformedPoint)
}

export const fromDomToScene = (sceneCTM, point) => applyInverseToPoint(
  sceneCTM,
  point
)

export const applyInverseToPoint = (currentMatrix, point) =>
  applyToPoint(inverse(currentMatrix), point)

export const zoom = (
  matrix,
  pivot,
  scaleIncrement,
  limits,
  mapSize,
  viewerSize
) => {
  const originalPivot = applyInverseToPoint(matrix, pivot)
  const incrementRatio = 1 + scaleIncrement
  const zoomedMatrix = applyZoom(matrix, originalPivot, incrementRatio)

  const zoomLimitedMatrix = limitZoom(
    zoomedMatrix,
    originalPivot,
    limits
  )

  return limitPan(
    zoomLimitedMatrix,
    mapSize,
    viewerSize
  )
}

const applyZoom = (
  matrix,
  pivot,
  incrementRatio
) => {
  const positiveRatio = Math.max(
    Number.EPSILON,
    incrementRatio
  )

  return transform(
    matrix,
    translate(pivot.x, pivot.y),
    scale(positiveRatio),
    translate(-pivot.x, -pivot.y)
  )
}

const limitZoom = (
  matrix,
  pivot,
  limits
) => {
  const { max, min } = limits
  const { scale } = decompose(matrix)

  const currentScale = scale.sx

  let scaleCorrection = 0

  if (currentScale > max) {
    scaleCorrection = max - currentScale
  }

  if (currentScale < min) {
    scaleCorrection = min - currentScale
  }

  const incrementRatio = (currentScale + scaleCorrection) / currentScale

  return applyZoom(
    matrix,
    pivot,
    incrementRatio
  )
}

export const pan = (
  currentTransformationMatrix,
  originPoint,
  targetPoint,
  mapSize,
  viewerSize
) => {
  const originalOriginPoint = applyInverseToPoint(
    currentTransformationMatrix,
    originPoint
  )

  const originalTargetPoint = applyInverseToPoint(
    currentTransformationMatrix,
    targetPoint
  )

  const translateDelta = {
    x: originalTargetPoint.x - originalOriginPoint.x,
    y: originalTargetPoint.y - originalOriginPoint.y
  }

  const pannedMatrix = applyPan(currentTransformationMatrix, translateDelta)

  return limitPan(
    pannedMatrix,
    mapSize,
    viewerSize
  )
}

const limitPan = (matrix, mapSize, viewerSize) => {
  const { x, y } = shiftPanOverflow(matrix, mapSize, viewerSize)

  return transform(
    translate(x, y),
    matrix
  )
}

const shiftPanOverflow = (matrix, mapSize, viewerSize) => {
  const { scale } = decompose(matrix)
  const mapOrigin = applyToPoint(matrix, { x: 0, y: 0 })

  const currentScale = scale.sx

  const scaledMapSize = {
    width: mapSize.width * currentScale,
    height: mapSize.height * currentScale
  }

  const mapBoundaries = {
    right: scaledMapSize.width + mapOrigin.x,
    bottom: scaledMapSize.height + mapOrigin.y
  }

  let isMapOverflowing = {
    top: false,
    right: false,
    bottom: false,
    left: false
  }

  if (scaledMapSize.width > viewerSize.width) {
    if (scaledMapSize.height > viewerSize.height) {
      isMapOverflowing = {
        right: mapBoundaries.right < viewerSize.width,
        left: mapOrigin.x > 0,
        top: mapOrigin.y > 0,
        bottom: mapBoundaries.bottom < viewerSize.height
      }
    } else {
      isMapOverflowing = {
        right: mapBoundaries.right < viewerSize.width,
        left: mapOrigin.x > 0,
        top: mapOrigin.y < 0,
        bottom: mapBoundaries.bottom > viewerSize.height
      }
    }
  } else {
    if (scaledMapSize.height > viewerSize.height) {
      isMapOverflowing = {
        right: mapBoundaries.right > viewerSize.width,
        left: mapOrigin.x < 0,
        top: mapOrigin.y > 0,
        bottom: mapBoundaries.bottom < viewerSize.height
      }
    } else {
      isMapOverflowing = {
        right: mapBoundaries.right > viewerSize.width,
        left: mapOrigin.x < 0,
        top: mapOrigin.y < 0,
        bottom: mapBoundaries.bottom > viewerSize.height
      }
    }
  }

  const translateDelta = {
    x: 0,
    y: 0
  }

  if (isMapOverflowing.top) {
    translateDelta.y = mapOrigin.y
  }

  if (isMapOverflowing.right) {
    translateDelta.x = mapBoundaries.right - viewerSize.width
  }

  if (isMapOverflowing.left) {
    translateDelta.x = mapOrigin.x
  }

  if (isMapOverflowing.bottom) {
    translateDelta.y = mapBoundaries.bottom - viewerSize.height
  }

  return {
    x: -translateDelta.x,
    y: -translateDelta.y
  }
}

const applyPan = (matrix, translateDelta) => {
  return transform(
    matrix,
    translate(translateDelta.x, translateDelta.y)
  )
}

/* Matrix decomposition functions */
const _translate = transformationMatrix => {
  const { e, f } = transformationMatrix
  return {
    x: e,
    y: f
  }
}

const _scale = transformationMatrix => {
  const { sign, sqrt, pow, abs } = Math
  const { a, b, c, d } = transformationMatrix

  return {
    sx: abs(sign(a) * sqrt(pow(a, 2) + pow(b, 2))),
    sy: abs(sign(d) * sqrt(pow(c, 2) + pow(d, 2)))
  }
}

const _rotate = transformationMatrix => {
  const { atan2, PI } = Math
  const { a, b } = transformationMatrix
  return atan2(-b, a) * 180 * -1 / PI
}

export const decompose = transformationMatrix => ({
  translate: _translate(transformationMatrix),
  scale: _scale(transformationMatrix),
  rotate: _rotate(transformationMatrix)
})

export const getDistanceBetweenPoints = (pointA, pointB) => (
  Math.sqrt(
    Math.pow(pointA.y - pointB.y, 2) + Math.pow(pointA.x - pointB.x, 2)
  )
)

export const getMidpoint = (pointA, pointB) => ({
  x: (pointA.x + pointB.x) / 2,
  y: (pointA.y + pointB.y) / 2
})
