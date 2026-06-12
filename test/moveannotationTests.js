import assert from 'assert'
import * as sgf from '../src/modules/fileformats/sgf.js'
import * as gametree from '../src/modules/gametree.js'

const [annotatedSiblingTree] = sgf.parse(`
(;SZ[9]
  (;B[aa]TE[1])
  (;B[bb]BM[1])
)
`)

describe('move annotations', () => {
  describe('getBoard', () => {
    it('includes move annotation types in sibling info', () => {
      let node = annotatedSiblingTree.root.children[0]
      let board = gametree.getBoard(annotatedSiblingTree, node.id)

      assert.deepEqual(board.markers[0][0], {
        type: 'point',
        moveAnnotationType: 'good',
      })
      assert.deepEqual(board.siblingsInfo[[0, 0]], {sign: 1, type: 'good'})
      assert.deepEqual(board.siblingsInfo[[1, 1]], {sign: 1, type: 'bad'})
    })
  })
})
