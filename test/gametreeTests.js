import assert from 'assert'
import * as sgf from '../src/modules/fileformats/sgf.js'
import * as gametree from '../src/modules/gametree.js'

const [tree] = sgf.parse(`
(;C[0];B[pd]C[1];W[dp]C[2];B[pp]C[3];W[dd]C[4]
  (;B[fc]C[5]
    (;W[cf]C[6];B[db]C[7];W[cc]C[8];B[ic]C[9])
    (;W[df]C[6a1];B[cc]C[6a2];W[dc]C[6a3];B[db]C[6a4])
    (;W[ec]C[6b1];B[fd]C[6b2];W[df]C[6b3];B[jd]C[6b4])
  )
  (;B[pj]C[5a1];W[nc]C[5a2];B[lc]C[5a3];W[qc]C[5a4]
    ;B[qd]C[5a5];W[pc]C[5a6];B[od]C[5a7]
    (;W[nb]C[5a8];B[me]C[5a9])
    (;W[nd]C[5a8a1];B[oc]C[5a8a2];W[ob]C[5a8a3];B[pb]C[5a8a4])
    (;W[rc]C[5a8b1])
  )
)
`)

function getCommentForTreePath(path) {
  let node = gametree.getNodeByTreePath(tree, path)
  return node == null ? null : node.data.C[0]
}

describe('gametree', () => {
  describe('parseTreePath', () => {
    it('parses GoGameTools-style tree paths', () => {
      assert.deepEqual(gametree.parseTreePath('16a2b3'), [
        {moveNumber: 16},
        {variationIndex: 1, moveNumber: 2},
        {variationIndex: 2, moveNumber: 3},
      ])
    })

    it('rejects invalid tree path formats', () => {
      assert.equal(gametree.parseTreePath('16aa2'), null)
      assert.equal(gametree.parseTreePath('16A2'), null)
      assert.equal(gametree.parseTreePath('16a'), null)
    })
  })

  describe('getNodeByTreePath', () => {
    it('finds main-line nodes', () => {
      assert.equal(getCommentForTreePath('0'), '0')
      assert.equal(getCommentForTreePath('5'), '5')
    })

    it('finds variation nodes', () => {
      assert.equal(getCommentForTreePath('6a2'), '6a2')
      assert.equal(getCommentForTreePath('6b3'), '6b3')
      assert.equal(getCommentForTreePath('5a8a3'), '5a8a3')
    })

    it('returns null for missing paths', () => {
      assert.equal(gametree.getNodeByTreePath(tree, '5c1'), null)
      assert.equal(gametree.getNodeByTreePath(tree, '5a99'), null)
      assert.equal(gametree.getNodeByTreePath(tree, '5a8c1'), null)
    })
  })

  describe('getTreePath', () => {
    it('formats main-line nodes', () => {
      assert.equal(gametree.getTreePath(tree, tree.root.id), '0')
      assert.equal(
        gametree.getTreePath(tree, gametree.getNodeByTreePath(tree, '5').id),
        '5',
      )
    })

    it('formats variation nodes', () => {
      for (let path of ['6a2', '6b3', '5a8a3']) {
        let node = gametree.getNodeByTreePath(tree, path)
        assert.equal(gametree.getTreePath(tree, node.id), path)
      }
    })

    it('returns null for missing nodes', () => {
      assert.equal(gametree.getTreePath(tree, 'missing'), null)
    })
  })
})
