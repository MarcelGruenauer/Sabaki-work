import assert from 'assert'
import {getTsumegoFrame} from '../src/modules/tsumegoframe.js'

describe('tsumegoframe', () => {
  it('does not generate frame stones on an empty board', () => {
    let signMap = Array.from({length: 9}, () => Array(9).fill(0))
    let frame = getTsumegoFrame(signMap, {
      komi: 6.5,
      blackToPlay: true,
      ko: false,
      margin: 4,
    })

    assert.deepEqual(frame.blacks, [])
    assert.deepEqual(frame.whites, [])
  })

  it('generates the KaTrain frame stones for a corner problem', () => {
    let signMap = Array.from({length: 9}, () => Array(9).fill(0))
    signMap[0][0] = 1
    signMap[0][1] = -1
    signMap[1][0] = 1

    let frame = getTsumegoFrame(signMap, {
      komi: 6.5,
      blackToPlay: true,
      ko: false,
      margin: 4,
    })

    assert.deepEqual(frame.blacks, [
      [7, 1],
      [8, 1],
      [6, 2],
      [7, 2],
      [8, 2],
      [6, 3],
      [7, 3],
      [8, 3],
      [6, 4],
      [7, 4],
      [6, 5],
      [8, 5],
      [1, 6],
      [3, 6],
      [5, 6],
      [7, 6],
      [2, 8],
      [3, 8],
      [4, 8],
    ])
    assert.deepEqual(frame.whites, [
      [5, 0],
      [6, 0],
      [7, 0],
      [8, 0],
      [5, 1],
      [6, 1],
      [5, 2],
      [5, 3],
      [5, 4],
      [0, 5],
      [1, 5],
      [2, 5],
      [3, 5],
      [4, 5],
      [5, 5],
      [0, 7],
      [1, 7],
      [2, 7],
      [3, 7],
      [1, 8],
    ])
  })

  it('keeps generated stones inside the board for multiple board sizes', () => {
    for (let [width, height] of [
      [2, 2],
      [3, 3],
      [5, 5],
      [9, 9],
      [13, 13],
      [19, 19],
      [25, 25],
      [9, 13],
      [13, 9],
    ]) {
      let signMap = Array.from({length: height}, () => Array(width).fill(0))
      signMap[0][0] = 1
      signMap[0][1] = -1
      signMap[1][0] = 1

      let frame = getTsumegoFrame(signMap, {
        komi: 6.5,
        blackToPlay: true,
        ko: true,
        margin: Math.min(4, width - 1, height - 1),
      })

      for (let [x, y] of [...frame.blacks, ...frame.whites]) {
        assert.ok(x >= 0 && x < width, `x=${x} outside width ${width}`)
        assert.ok(y >= 0 && y < height, `y=${y} outside height ${height}`)
      }
    }
  })
})
