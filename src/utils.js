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
  mapLimits,
  panLimits
) => {
  const originalPivot = applyInverseToPoint(matrix, pivot)
  const incrementRatio = 1 + scaleIncrement
  const zoomedMatrix = applyZoom(matrix, originalPivot, incrementRatio)

  const zoomLimitedMatrix = limitZoom(
    zoomedMatrix,
    originalPivot,
    limits
  )

  if (!mapLimits || !panLimits) {
    return zoomLimitedMatrix
  }

  return limitPan(
    zoomLimitedMatrix,
    mapLimits,
    panLimits
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
  mapLimits,
  panLimits
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

  if (!mapLimits || !panLimits) {
    return pannedMatrix
  }

  return limitPan(
    pannedMatrix,
    mapLimits,
    panLimits
  )
}

const limitPan = (matrix, mapLimits, panLimits) => {
  const { x, y } = shiftPanOverflow(matrix, mapLimits, panLimits)

  return transform(
    translate(x, y),
    matrix
  )
}

const shiftPanOverflow = (matrix, mapLimits, panLimits) => {
  const { scale } = decompose(matrix)
  const mapOrigin = applyToPoint(matrix, { x: 0, y: 0 })

  const currentScale = scale.sx

  const scaledMapSize = {
    width: mapLimits.maxX * currentScale,
    height: mapLimits.maxY * currentScale
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

  if (scaledMapSize.width > panLimits.maxX - panLimits.minX) {
    if (scaledMapSize.height > panLimits.maxY - panLimits.minY) {
      isMapOverflowing = {
        right: mapBoundaries.right < panLimits.maxX,
        left: mapOrigin.x > panLimits.minX,
        top: mapOrigin.y > panLimits.minY,
        bottom: mapBoundaries.bottom < panLimits.maxY
      }
    } else {
      isMapOverflowing = {
        right: mapBoundaries.right < panLimits.maxX,
        left: mapOrigin.x > panLimits.minX,
        top: mapOrigin.y < panLimits.minY,
        bottom: mapBoundaries.bottom > panLimits.maxY
      }
    }
  } else {
    if (scaledMapSize.height > panLimits.maxY - panLimits.minY) {
      isMapOverflowing = {
        right: mapBoundaries.right > panLimits.maxX,
        left: mapOrigin.x < panLimits.minX,
        top: mapOrigin.y > panLimits.minY,
        bottom: mapBoundaries.bottom < panLimits.maxY
      }
    } else {
      isMapOverflowing = {
        right: mapBoundaries.right > panLimits.maxX,
        left: mapOrigin.x < panLimits.minX,
        top: mapOrigin.y < panLimits.minY,
        bottom: mapBoundaries.bottom > panLimits.maxY
      }
    }
  }

  const translateDelta = {
    x: 0,
    y: 0
  }

  if (isMapOverflowing.top) {
    translateDelta.y = mapOrigin.y - panLimits.minY
  }

  if (isMapOverflowing.right) {
    translateDelta.x = mapBoundaries.right - panLimits.maxX
  }

  if (isMapOverflowing.left) {
    translateDelta.x = mapOrigin.x - panLimits.minX
  }

  if (isMapOverflowing.bottom) {
    translateDelta.y = mapBoundaries.bottom - panLimits.maxY
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
