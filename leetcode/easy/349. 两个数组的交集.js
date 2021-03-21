/**
 * @param {number[]} nums1
 * @param {number[]} nums2
 * @return {number[]}
 */
const intersection = function (nums1, nums2) {
  if (nums1.length > nums2.length) [nums1, nums2] = [nums2, nums1]
  const cache = new Set(nums1)
  const result = new Set()
  for (let i = 0; i < nums2.length; i++) {
    if (cache.has(nums2[i])) {
      result.add(nums2[i])
    }
  }
  return [...result]
}
