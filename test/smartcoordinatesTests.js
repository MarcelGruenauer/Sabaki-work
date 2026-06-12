import assert from 'assert'
import {fromDimensions} from '@sabaki/go-board'
import {
  getSmartCoordinateData,
  parseCoordinate,
} from '../src/modules/smartcoordinates.js'

function getBoard(width = 19, height = 19) {
  let board = fromDimensions(width, height)

  board.markers = board.signMap.map((row) => row.map((_) => null))

  return board
}

describe('smartcoordinates', () => {
  describe('parseCoordinate', () => {
    it('parses human-readable coordinates and skips I', () => {
      let board = getBoard()

      assert.deepEqual(parseCoordinate('A1', board), [0, 18])
      assert.deepEqual(parseCoordinate('H3', board), [7, 16])
      assert.deepEqual(parseCoordinate('J3', board), [8, 16])
      assert.equal(parseCoordinate('I5', board), null)
    })

    it('rejects coordinates outside the board size', () => {
      let board = getBoard(9, 9)

      assert.deepEqual(parseCoordinate('J9', board), [8, 0])
      assert.equal(parseCoordinate('K9', board), null)
      assert.equal(parseCoordinate('A10', board), null)
    })
  })

  describe('getSmartCoordinateData', () => {
    it('maps repeated coordinates to the same generated label', () => {
      let board = getBoard()
      let data = getSmartCoordinateData('D4 approaches K10, D4 follows.', board)

      assert.equal(data.comment, 'A approaches B, A follows.')
      assert.deepEqual(data.markers, [
        {vertex: [3, 15], label: 'A'},
        {vertex: [9, 9], label: 'B'},
      ])
    })

    it('starts after existing single-letter board labels', () => {
      let board = getBoard()
      board.markers[18][0] = {type: 'label', label: 'A'}
      board.markers[17][1] = {type: 'label', label: 'C'}

      let data = getSmartCoordinateData('D4 K10', board)

      assert.equal(data.comment, 'D E')
      assert.deepEqual(data.markers, [
        {vertex: [3, 15], label: 'D'},
        {vertex: [9, 9], label: 'E'},
      ])
    })

    it('uses existing labels at referenced intersections', () => {
      let board = getBoard()
      board.markers[15][3] = {type: 'label', label: 'tesuji'}

      let data = getSmartCoordinateData('D4 and K10', board)

      assert.equal(data.comment, 'tesuji and A')
      assert.deepEqual(data.markers, [{vertex: [9, 9], label: 'A'}])
    })

    it('leaves coordinates with existing non-label markers unchanged', () => {
      let board = getBoard()
      board.markers[15][3] = {type: 'circle'}

      let data = getSmartCoordinateData('D4 and K10', board)

      assert.equal(data.comment, 'D4 and A')
      assert.deepEqual(data.markers, [{vertex: [9, 9], label: 'A'}])
    })
  })
})
