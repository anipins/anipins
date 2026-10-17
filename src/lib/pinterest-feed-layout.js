function cardHeight(item) {
  const width = Number(item?.width) || 1;
  const height = Number(item?.height) || width * 1.3;
  return height / width + 0.05;
}

function shortestColumn(heights, offset = 0) {
  let target = offset;
  for (let index = offset + 1; index < heights.length; index++) {
    if (heights[index] < heights[target]) target = index;
  }
  return target;
}

/**
 * Split one ordered, paginated artwork stream into Pinterest's top composition:
 * four columns below the opened pin, two recommendation columns beside it.
 * New pages are assigned to whichever of the six stacks is currently shortest.
 */
function distributePinterestFeed(items, {
  totalColumns = 6,
  mainColumnCount = 4,
  sideItemCount = 8,
  initialMainItemCount = 6,
  leadingHeight = 2.6,
} = {}) {
  const columnCount = Math.max(3, Math.floor(totalColumns));
  const mainCount = Math.min(Math.max(1, Math.floor(mainColumnCount)), columnCount - 2);
  const sideCount = columnCount - mainCount;
  const mainColumns = Array.from({ length: mainCount }, () => []);
  const sideColumns = Array.from({ length: sideCount }, () => []);
  const mainHeights = Array.from({ length: mainCount }, () => Math.max(0, Number(leadingHeight) || 0));
  const sideHeights = Array.from({ length: sideCount }, () => 0);
  const allHeights = [...mainHeights, ...sideHeights];
  const sideLimit = Math.min(items.length, Math.max(0, Math.floor(sideItemCount)));
  const mainLimit = Math.min(items.length, sideLimit + Math.max(0, Math.floor(initialMainItemCount)));

  items.forEach((item, itemIndex) => {
    const size = cardHeight(item);
    if (itemIndex < sideLimit) {
      const target = shortestColumn(sideHeights);
      sideColumns[target].push(item);
      sideHeights[target] += size;
      allHeights[mainCount + target] += size;
      return;
    }
    if (itemIndex < mainLimit) {
      const target = shortestColumn(mainHeights);
      mainColumns[target].push(item);
      mainHeights[target] += size;
      allHeights[target] += size;
      return;
    }

    const target = shortestColumn(allHeights);
    if (target < mainCount) {
      mainColumns[target].push(item);
      mainHeights[target] += size;
    } else {
      sideColumns[target - mainCount].push(item);
      sideHeights[target - mainCount] += size;
    }
    allHeights[target] += size;
  });

  return { mainColumns, sideColumns, mainHeights, sideHeights, mainColumnCount: mainCount };
}

module.exports = { distributePinterestFeed };
