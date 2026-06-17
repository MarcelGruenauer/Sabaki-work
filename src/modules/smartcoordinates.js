const alpha = 'ABCDEFGHJKLMNOPQRSTUVWXYZ'
const labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const coordRegex = /\b([A-HJ-Za-hj-z])([1-9][0-9]*)\b/g

function labelToX(label) {
  return alpha.indexOf(label.toUpperCase())
}

function vertexToKey([x, y]) {
  return `${x},${y}`
}

function getMarker(board, [x, y]) {
  return board.markers?.[y]?.[x] ?? null
}

function isCurrentMoveMarker(board, vertex, marker) {
  return (
    marker?.type === 'point' &&
    board.currentVertex != null &&
    vertexToKey(vertex) === vertexToKey(board.currentVertex)
  )
}

function getNextLabel(usedLabels) {
  let lastIndex = -1

  for (let label of usedLabels) {
    let index = labels.indexOf(label)
    if (index >= 0) lastIndex = Math.max(lastIndex, index)
  }

  return labels[lastIndex + 1] ?? null
}

export function parseCoordinate(coord, board) {
  let match = coord.match(/^([A-HJ-Za-hj-z])([1-9][0-9]*)$/)
  if (match == null) return null

  let x = labelToX(match[1])
  let y = board.height - +match[2]

  return x >= 0 && x < board.width && y >= 0 && y < board.height ? [x, y] : null
}

export function getSmartCoordinateData(comment, board) {
  if (comment == null || comment === '' || board == null) {
    return {comment, markers: []}
  }

  let usedLabels = new Set()
  let vertexLabels = new Map()
  let smartLabels = new Map()
  let markers = []

  for (let y = 0; y < board.height; y++) {
    for (let x = 0; x < board.width; x++) {
      let marker = getMarker(board, [x, y])
      if (marker?.type !== 'label') continue

      let {label} = marker
      if (/^[A-Z]$/.test(label)) usedLabels.add(label)
      vertexLabels.set(vertexToKey([x, y]), label)
    }
  }

  let smartComment = comment.replace(coordRegex, (coord) => {
    let vertex = parseCoordinate(coord, board)
    if (vertex == null) return coord

    let key = vertexToKey(vertex)
    if (vertexLabels.has(key)) return vertexLabels.get(key)

    let marker = getMarker(board, vertex)
    let currentMoveMarker = isCurrentMoveMarker(board, vertex, marker)
    if (marker != null && !currentMoveMarker) return coord

    if (!smartLabels.has(key)) {
      let label = getNextLabel(usedLabels)
      if (label == null) return coord

      usedLabels.add(label)
      smartLabels.set(key, label)
      markers.push({
        vertex,
        label,
        ...(currentMoveMarker ? {currentMoveMarker} : {}),
      })
    }

    return smartLabels.get(key)
  })

  return {
    comment: smartComment,
    markers,
  }
}
