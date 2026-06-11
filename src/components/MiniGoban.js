import {h, Component} from 'preact'

const range = (n) => [...Array(n)].map((_, i) => i)

let getCrop = (board) => {
  let vertices = []

  for (let x = 0; x < board.width; x++) {
    for (let y = 0; y < board.height; y++) {
      if (board.get([x, y]) !== 0) vertices.push([x, y])
    }
  }

  if (vertices.length === 0) return null

  let leftWidth = Math.ceil(board.width / 2)
  let topHeight = Math.ceil(board.height / 2)
  let quadrants = [
    {x: 0, y: 0, width: leftWidth, height: topHeight},
    {x: leftWidth, y: 0, width: board.width - leftWidth, height: topHeight},
    {x: 0, y: topHeight, width: leftWidth, height: board.height - topHeight},
    {
      x: leftWidth,
      y: topHeight,
      width: board.width - leftWidth,
      height: board.height - topHeight,
    },
  ]

  return quadrants.find(({x, y, width, height}) =>
    vertices.every(
      ([vx, vy]) => x <= vx && vx < x + width && y <= vy && vy < y + height,
    ),
  )
}

export default class MiniGoban extends Component {
  shouldComponentUpdate({board, maxSize, visible, cropToQuadrant}) {
    return (
      visible !== this.props.visible ||
      maxSize !== this.props.maxSize ||
      cropToQuadrant !== this.props.cropToQuadrant ||
      board !== this.props.board
    )
  }

  render({board, maxSize, visible = true, cropToQuadrant = false}) {
    let crop =
      cropToQuadrant && board.width > 1 && board.height > 1
        ? getCrop(board)
        : null
    let offsetX = crop == null ? 0 : crop.x
    let offsetY = crop == null ? 0 : crop.y
    let width = crop == null ? board.width : crop.width
    let height = crop == null ? board.height : crop.height
    let fieldSize = (maxSize - 1) / Math.max(width, height)
    let radius = fieldSize / 2
    let rangeX = range(width)
    let rangeY = range(height)
    let gridX1 = offsetX === 0 ? radius + 1 : 1
    let gridY1 = offsetY === 0 ? radius + 1 : 1
    let gridX2 =
      offsetX + width === board.width
        ? (width - 1) * fieldSize + radius + 1
        : width * fieldSize + 1
    let gridY2 =
      offsetY + height === board.height
        ? (height - 1) * fieldSize + radius + 1
        : height * fieldSize + 1

    return h(
      'svg',
      {
        width: fieldSize * width + 1,
        height: fieldSize * height + 1,
        style: {visibility: visible ? 'visible' : 'hidden'},
      },

      // Draw board grid for cropped previews

      crop != null &&
        h(
          'g',
          {
            stroke: '#5E2E0C',
            'stroke-opacity': 0.65,
            'stroke-width': 0.5,
          },
          rangeY.map((y) =>
            h('line', {
              x1: gridX1,
              y1: y * fieldSize + radius + 1,
              x2: gridX2,
              y2: y * fieldSize + radius + 1,
            }),
          ),
          rangeX.map((x) =>
            h('line', {
              x1: x * fieldSize + radius + 1,
              y1: gridY1,
              x2: x * fieldSize + radius + 1,
              y2: gridY2,
            }),
          ),
        ),

      // Draw hoshi points

      board.getHandicapPlacement(9).map(([x, y]) =>
        x < offsetX ||
        x >= offsetX + width ||
        y < offsetY ||
        y >= offsetY + height
          ? null
          : h('circle', {
              cx: (x - offsetX) * fieldSize + radius + 1,
              cy: (y - offsetY) * fieldSize + radius + 1,
              r: 2,
              fill: '#5E2E0C',
            }),
      ),

      // Draw shadows

      rangeX.map((x) =>
        rangeY.map(
          (y) =>
            board.get([x + offsetX, y + offsetY]) !== 0 &&
            h('circle', {
              cx: x * fieldSize + radius + 1,
              cy: y * fieldSize + radius + 2,
              r: radius,
              fill: 'rgba(0, 0, 0, .5)',
            }),
        ),
      ),

      // Draw stones

      rangeX.map((x) =>
        rangeY.map(
          (y) =>
            board.get([x + offsetX, y + offsetY]) !== 0 &&
            h('circle', {
              cx: x * fieldSize + radius + 1,
              cy: y * fieldSize + radius + 1,
              r: radius,
              fill:
                board.get([x + offsetX, y + offsetY]) < 0 ? 'white' : 'black',
            }),
        ),
      ),
    )
  }
}
