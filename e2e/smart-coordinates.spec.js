const {expect} = require('@playwright/test')
const {test} = require('./fixtures/electron-app')
const {
  loadSgfStringAndWait,
  gotoChildPath,
  waitForRender,
} = require('./helpers')

async function getCurrentSmartCoordinateData(page, vertex) {
  return page.evaluate(([x, y]) => {
    let vertex = document.querySelector(
      `.shudan-vertex[data-x="${x}"][data-y="${y}"]`,
    )
    let stone = vertex.querySelector('.shudan-stone')
    let point = vertex.querySelector('.shudan-marker')

    return {
      className: vertex.className,
      title: vertex.getAttribute('title'),
      stoneTransform: getComputedStyle(stone).transform,
      labelContent: getComputedStyle(stone, '::after').content,
      labelColor: getComputedStyle(stone, '::after').color,
      pointFill: getComputedStyle(point).fill,
    }
  }, vertex)
}

test.describe('Smart Coordinates', () => {
  test('current-move smart coordinate follows fuzzy stone placement', async ({
    page,
  }) => {
    await page.evaluate(async () => {
      Math.random = () => 0.99
      await window.sabaki.setting.set('comments.smart_coordinates', true)
      await window.sabaki.setting.set('view.fuzzy_stone_placement', true)
    })

    await page.waitForFunction(
      () =>
        window.__sabaki.state.smartCoordinates === true &&
        window.__sabaki.state.fuzzyStonePlacement === true,
    )

    await loadSgfStringAndWait(
      page,
      '(;GM[1]FF[4]CA[UTF-8]SZ[13];B[md]C[N10 is the current move.];W[kd]C[L10 is the current move.])',
    )
    await gotoChildPath(page, [0])
    await waitForRender(page)

    let data = await getCurrentSmartCoordinateData(page, [12, 3])

    expect(data.className).toContain('shudan-marker_point')
    expect(data.className).toContain('shudan-shift_')
    expect(data.className).toContain('shudan-sign_1')
    expect(data.title).toBe('A')
    expect(data.stoneTransform).not.toBe('none')
    expect(data.labelContent).toBe('"A"')
    expect(data.labelColor).toBe('rgb(238, 238, 238)')
    expect(data.pointFill).toBe('rgb(138, 138, 138)')

    await gotoChildPath(page, [0, 0])
    await waitForRender(page)

    data = await getCurrentSmartCoordinateData(page, [10, 3])

    expect(data.className).toContain('shudan-marker_point')
    expect(data.className).toContain('shudan-sign_-1')
    expect(data.title).toBe('A')
    expect(data.labelContent).toBe('"A"')
    expect(data.labelColor).toBe('rgb(34, 34, 34)')
    expect(data.pointFill).toBe('rgb(138, 138, 138)')
  })
})
