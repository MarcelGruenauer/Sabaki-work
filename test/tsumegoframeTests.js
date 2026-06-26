import assert from 'assert'
import * as gametree from '../src/modules/gametree.js'
import {
  getTsumegoFrame,
  getTsumegoFramePlayer,
} from '../src/modules/tsumegoframe.js'

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

  it('takes the color to play into consideration for ko', () => {
    let signMap = Array.from({length: 9}, () => Array(9).fill(0))
    signMap[0][0] = 1
    signMap[0][1] = -1
    signMap[1][0] = 1

    let blackFrame = getTsumegoFrame(signMap, {
      komi: 6.5,
      blackToPlay: true,
      ko: true,
      margin: 4,
    })
    let whiteFrame = getTsumegoFrame(signMap, {
      komi: 6.5,
      blackToPlay: false,
      ko: true,
      margin: 4,
    })

    assert.notDeepEqual(blackFrame.blacks, whiteFrame.blacks)
    assert.notDeepEqual(blackFrame.whites, whiteFrame.whites)
  })

  it('defaults the color to play from the current node move', () => {
    let tree = gametree.new().mutate((draft) => {
      draft.appendNode(draft.root.id, {B: ['aa']})
      draft.appendNode(draft.root.id, {W: ['bb']})
    })
    let [blackNode, whiteNode] = tree.root.children

    assert.equal(getTsumegoFramePlayer(tree, blackNode.id), -1)
    assert.equal(getTsumegoFramePlayer(tree, whiteNode.id), 1)
  })

  it('defaults the color to play from PL before the next move', () => {
    let tree = gametree.new().mutate((draft) => {
      draft.updateProperty(draft.root.id, 'PL', ['W'])
      draft.appendNode(draft.root.id, {B: ['aa']})
    })

    assert.equal(getTsumegoFramePlayer(tree, tree.root.id), -1)
  })

  it('defaults the color to play from the current variation next move', () => {
    let tree = gametree.new().mutate((draft) => {
      draft.appendNode(draft.root.id, {B: ['aa']})
      draft.appendNode(draft.root.id, {W: ['bb']})
    })
    let [blackNode, whiteNode] = tree.root.children

    assert.equal(getTsumegoFramePlayer(tree, tree.root.id), 1)
    assert.equal(
      getTsumegoFramePlayer(tree, tree.root.id, {
        [tree.root.id]: whiteNode.id,
      }),
      -1,
    )
    assert.equal(
      getTsumegoFramePlayer(tree, tree.root.id, {
        [tree.root.id]: blackNode.id,
      }),
      1,
    )
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
