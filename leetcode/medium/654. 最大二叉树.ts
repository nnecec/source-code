/**
 * Definition for a binary tree node.
 */

class TreeNode {
	val: number;
	left: TreeNode | null;
	right: TreeNode | null;
	constructor(val?: number, left?: TreeNode | null, right?: TreeNode | null) {
		this.val = val === undefined ? 0 : val;
		this.left = left === undefined ? null : left;
		this.right = right === undefined ? null : right;
	}
}

function build(nums: number[], lo: number, hi: number) {
	if (lo > hi) {
		return null;
	}

	let index = -1;
	let maxVal = Number.MIN_SAFE_INTEGER;

	for (let i = lo; i <= hi; i++) {
		if (maxVal < nums[i]) {
			index = i;
			maxVal = nums[i];
		}
	}
	const root = new TreeNode(maxVal);
	root.left = build(nums, lo, index - 1);
	root.right = build(nums, index + 1, hi);
	return root;
}

function constructMaximumBinaryTree(nums: number[]): TreeNode | null {
	return build(nums, 0, nums.length - 1);
}
console.log(constructMaximumBinaryTree([3, 2, 1, 6, 0, 5]));
