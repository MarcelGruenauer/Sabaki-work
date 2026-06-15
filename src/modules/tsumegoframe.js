const nearToEdge = 2
const offenceToWin = 5

function xor(a, b) {
  return !!a !== !!b
}

function snap(k, to) {
  return Math.abs(k - to) <= nearToEdge ? to : k
}

function snap0(k) {
  return snap(k, 0)
}

function snapS(k, size) {
  return snap(k, size - 1)
}

function minBy(list, key, sign) {
  return list.reduce((best, item) =>
    sign * item[key] < sign * best[key] ? item : best,
  )
}

function needFlip(kmin, kmax, size) {
  return kmin < size - kmax - 1
}

function height(k, size) {
  return size - Math.abs(k - (size - 1) / 2)
}

function height2(stone, sizes) {
  let [isize, jsize] = sizes
  return height(stone.i, isize) + height(stone.j, jsize)
}

function guessBlackToAttack(extrema, sizes) {
  return (
    extrema.reduce(
      (sum, stone) => sum + (stone.black ? 1 : -1) * height2(stone, sizes),
      0,
    ) > 0
  )
}

function sizes(stones) {
  return [stones.length, stones[0].length]
}

function flip1(k, size, flag) {
  return flag ? size - 1 - k : k
}

function flipIJ([i, j], [isize, jsize], [flipI, flipJ, swapIJ]) {
  let fi = flip1(i, isize, flipI)
  let fj = flip1(j, jsize, flipJ)
  return swapIJ ? [fj, fi] : [fi, fj]
}

function flipStones(stones, flipSpec) {
  let swap = flipSpec[2]
  let oldSizes = sizes(stones)
  let [isize, jsize] = oldSizes
  let [newIsize, newJsize] = swap ? [jsize, isize] : [isize, jsize]
  let result = Array.from({length: newIsize}, () => Array(newJsize))

  for (let i = 0; i < isize; i++) {
    for (let j = 0; j < jsize; j++) {
      let [newI, newJ] = flipIJ([i, j], oldSizes, flipSpec)
      result[newI][newJ] = stones[i][j]
    }
  }

  return result
}

function inside(i, j, [i0, i1, j0, j1]) {
  return i0 <= i && i <= i1 && j0 <= j && j <= j1
}

function putStone(
  stones,
  [isize, jsize],
  i,
  j,
  black,
  empty,
  tsumegoFrameRegionMark = false,
) {
  if (i < 0 || isize <= i || j < 0 || jsize <= j) return

  stones[i][j] = empty
    ? {}
    : {
        stone: true,
        tsumegoFrame: true,
        black,
        tsumegoFrameRegionMark,
      }
}

function putTwin(stones, boardSizes, beg, end, at0, at1, black, reverse) {
  for (let at of [at0, at1]) {
    for (let k = beg; k <= end; k++) {
      let [i, j] = reverse ? [at, k] : [k, at]
      putStone(stones, boardSizes, i, j, black, false, true)
    }
  }
}

function putBorder(stones, boardSizes, frameRange, black) {
  let [i0, i1, j0, j1] = frameRange
  putTwin(stones, boardSizes, i0, i1, j0, j1, black, false)
  putTwin(stones, boardSizes, j0, j1, i0, i1, black, true)
}

function putOutside(
  stones,
  boardSizes,
  frameRange,
  blackToAttack,
  blackToPlay,
  komi,
) {
  let [isize, jsize] = boardSizes
  let count = 0
  let offenseKomi = (blackToAttack ? 1 : -1) * komi
  let defenseArea = (isize * jsize - offenseKomi - offenceToWin) / 2

  for (let i = 0; i < isize; i++) {
    for (let j = 0; j < jsize; j++) {
      if (inside(i, j, frameRange)) continue

      count++

      let black = xor(blackToAttack, count <= defenseArea)
      let empty = (i + j) % 2 === 0 && Math.abs(count - defenseArea) > isize
      putStone(stones, boardSizes, i, j, black, empty)
    }
  }
}

const offenseKoThreat = {
  pattern: `
....OOOX.
.....XXXX
`,
  top: true,
  left: false,
}

const defenseKoThreat = {
  pattern: `
..
..
X.
XO
OO
.O
`,
  top: false,
  left: true,
}

function putKoThreat(
  stones,
  boardSizes,
  frameRange,
  blackToAttack,
  blackToPlay,
  ko,
) {
  let [isize, jsize] = boardSizes
  let forOffense = xor(ko, xor(blackToAttack, blackToPlay))
  let {pattern, top, left} = forOffense ? offenseKoThreat : defenseKoThreat
  let grid = pattern
    .split('\n')
    .filter((line) => line.length > 0)
    .map((line) => [...line])
  let [height, width] = sizes(grid)

  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      let ai = i + (top ? 0 : isize - height)
      let aj = j + (left ? 0 : jsize - width)

      if (inside(ai, aj, frameRange)) return

      let ch = grid[i][j]
      let black = xor(blackToAttack, ch === 'O')
      let empty = ch === '.'
      putStone(stones, boardSizes, ai, aj, black, empty)
    }
  }
}

function pickAll(stones, key) {
  let result = []

  for (let i = 0; i < stones.length; i++) {
    for (let j = 0; j < stones[i].length; j++) {
      let stone = stones[i][j]
      if (stone[key]) result.push([i, j, stone.black])
    }
  }

  return result
}

function getAnalysisRegion(regionPos) {
  if (regionPos.length === 0) return null

  let is = regionPos.map(([i]) => i)
  let js = regionPos.map(([, j]) => j)
  let ri = [Math.min(...is), Math.max(...is)]
  let rj = [Math.min(...js), Math.max(...js)]

  return ri[0] < ri[1] && rj[0] < rj[1] ? [ri, rj] : null
}

function frameStones(stones, komi, blackToPlay, ko, margin) {
  let boardSizes = sizes(stones)
  let [isize, jsize] = boardSizes
  let occupied = []

  for (let i = 0; i < isize; i++) {
    for (let j = 0; j < jsize; j++) {
      if (stones[i][j].stone) {
        occupied.push({i, j, black: stones[i][j].black})
      }
    }
  }

  if (occupied.length === 0) return []

  let top = minBy(occupied, 'i', 1)
  let left = minBy(occupied, 'j', 1)
  let bottom = minBy(occupied, 'i', -1)
  let right = minBy(occupied, 'j', -1)
  let imin = snap0(top.i)
  let jmin = snap0(left.j)
  let imax = snapS(bottom.i, isize)
  let jmax = snapS(right.j, jsize)

  let flipSpec =
    imin < jmin
      ? [false, false, true]
      : [needFlip(imin, imax, isize), needFlip(jmin, jmax, jsize), false]

  if (flipSpec.includes(true)) {
    let filled = frameStones(
      flipStones(stones, flipSpec),
      komi,
      blackToPlay,
      ko,
      margin,
    )
    return flipStones(filled, flipSpec)
  }

  let frameRange = [imin - margin, imax + margin, jmin - margin, jmax + margin]
  let blackToAttack = guessBlackToAttack([top, bottom, left, right], boardSizes)

  putBorder(stones, boardSizes, frameRange, blackToAttack)
  putOutside(stones, boardSizes, frameRange, blackToAttack, blackToPlay, komi)
  putKoThreat(stones, boardSizes, frameRange, blackToAttack, blackToPlay, ko)

  return stones
}

export function getTsumegoFrame(signMap, {komi = 0, blackToPlay, ko, margin}) {
  let stones = signMap.map((row) =>
    row.map((sign) => (sign === 0 ? {} : {stone: true, black: sign > 0})),
  )
  let filledStones = frameStones(stones, komi, blackToPlay, ko, margin)
  let regionPos = pickAll(filledStones, 'tsumegoFrameRegionMark')
  let frame = pickAll(filledStones, 'tsumegoFrame')

  return {
    blacks: frame.filter(([, , black]) => black).map(([i, j]) => [j, i]),
    whites: frame.filter(([, , black]) => !black).map(([i, j]) => [j, i]),
    analysisRegion: getAnalysisRegion(regionPos),
  }
}
