// Auto-generated from leetcode-hot100.ts — javascript solutions
// DO NOT EDIT MANUALLY

export const javascriptSolutions: Record<string, string> = {
  'lc-001': `var twoSum = function(nums, target) {
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const diff = target - nums[i];
        if (map.has(diff)) {
            return [map.get(diff), i];
        }
        map.set(nums[i], i);
    }
    return [];
};`,
  'lc-002': `var groupAnagrams = function(strs) {
    const map = new Map();
    for (const s of strs) {
        const key = s.split('').sort().join('');
        if (!map.has(key)) {
            map.set(key, []);
        }
        map.get(key).push(s);
    }
    return Array.from(map.values());
};`,
  'lc-003': `var longestConsecutive = function(nums) {
    const set = new Set(nums);
    let longest = 0;
    for (const num of set) {
        if (!set.has(num - 1)) {
            let cur = num;
            let streak = 1;
            while (set.has(cur + 1)) {
                cur++;
                streak++;
            }
            longest = Math.max(longest, streak);
        }
    }
    return longest;
};`,
  'lc-004': `var subarraySum = function(nums, k) {
    const count = new Map();
    count.set(0, 1);
    let preSum = 0;
    let ans = 0;
    for (const num of nums) {
        preSum += num;
        ans += count.get(preSum - k) || 0;
        count.set(preSum, (count.get(preSum) || 0) + 1);
    }
    return ans;
};`,
  'lc-005': `var moveZeroes = function(nums) {
    let slow = 0;
    for (let fast = 0; fast < nums.length; fast++) {
        if (nums[fast] !== 0) {
            [nums[slow], nums[fast]] = [nums[fast], nums[slow]];
            slow++;
        }
    }
};`,
  'lc-006': `var maxArea = function(height) {
    let l = 0, r = height.length - 1;
    let ans = 0;
    while (l < r) {
        const area = Math.min(height[l], height[r]) * (r - l);
        ans = Math.max(ans, area);
        if (height[l] < height[r]) {
            l++;
        } else {
            r--;
        }
    }
    return ans;
};`,
  'lc-007': `var threeSum = function(nums) {
    nums.sort((a, b) => a - b);
    const n = nums.length;
    const res = [];
    for (let i = 0; i < n - 2; i++) {
        if (i > 0 && nums[i] === nums[i - 1]) continue;
        let l = i + 1, r = n - 1;
        while (l < r) {
            const sum = nums[i] + nums[l] + nums[r];
            if (sum < 0) {
                l++;
            } else if (sum > 0) {
                r--;
            } else {
                res.push([nums[i], nums[l], nums[r]]);
                while (l < r && nums[l] === nums[l + 1]) l++;
                while (l < r && nums[r] === nums[r - 1]) r--;
                l++;
                r--;
            }
        }
    }
    return res;
};`,
  'lc-008': `var trap = function(height) {
    let l = 0, r = height.length - 1;
    let leftMax = 0, rightMax = 0;
    let ans = 0;
    while (l < r) {
        leftMax = Math.max(leftMax, height[l]);
        rightMax = Math.max(rightMax, height[r]);
        if (height[l] < height[r]) {
            ans += leftMax - height[l];
            l++;
        } else {
            ans += rightMax - height[r];
            r--;
        }
    }
    return ans;
};`,
  'lc-009': `var firstMissingPositive = function(nums) {
    const n = nums.length;
    for (let i = 0; i < n; i++) {
        while (nums[i] >= 1 && nums[i] <= n && nums[nums[i] - 1] !== nums[i]) {
            const temp = nums[nums[i] - 1];
            nums[nums[i] - 1] = nums[i];
            nums[i] = temp;
        }
    }
    for (let i = 0; i < n; i++) {
        if (nums[i] !== i + 1) {
            return i + 1;
        }
    }
    return n + 1;
};`,
  'lc-010': `var setZeroes = function(matrix) {
    const m = matrix.length, n = matrix[0].length;
    let row0 = false, col0 = false;
    for (let j = 0; j < n; j++) {
        if (matrix[0][j] === 0) { row0 = true; break; }
    }
    for (let i = 0; i < m; i++) {
        if (matrix[i][0] === 0) { col0 = true; break; }
    }
    for (let i = 1; i < m; i++) {
        for (let j = 1; j < n; j++) {
            if (matrix[i][j] === 0) {
                matrix[i][0] = 0;
                matrix[0][j] = 0;
            }
        }
    }
    for (let i = 1; i < m; i++) {
        if (matrix[i][0] === 0) {
            for (let j = 0; j < n; j++) {
                matrix[i][j] = 0;
            }
        }
    }
    for (let j = 1; j < n; j++) {
        if (matrix[0][j] === 0) {
            for (let i = 0; i < m; i++) {
                matrix[i][j] = 0;
            }
        }
    }
    if (row0) {
        for (let j = 0; j < n; j++) {
            matrix[0][j] = 0;
        }
    }
    if (col0) {
        for (let i = 0; i < m; i++) {
            matrix[i][0] = 0;
        }
    }
};`,
  'lc-011': `var spiralOrder = function(matrix) {
    const res = [];
    let top = 0, bottom = matrix.length - 1;
    let left = 0, right = matrix[0].length - 1;
    while (top <= bottom && left <= right) {
        for (let j = left; j <= right; j++) {
            res.push(matrix[top][j]);
        }
        top++;
        for (let i = top; i <= bottom; i++) {
            res.push(matrix[i][right]);
        }
        right--;
        if (top <= bottom) {
            for (let j = right; j >= left; j--) {
                res.push(matrix[bottom][j]);
            }
            bottom--;
        }
        if (left <= right) {
            for (let i = bottom; i >= top; i--) {
                res.push(matrix[i][left]);
            }
            left++;
        }
    }
    return res;
};`,
  'lc-012': `var rotate = function(matrix) {
    const n = matrix.length;
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            [matrix[i][j], matrix[j][i]] = [matrix[j][i], matrix[i][j]];
        }
    }
    for (let i = 0; i < n; i++) {
        matrix[i].reverse();
    }
};`,
  'lc-013': `var merge = function(nums1, m, nums2, n) {
    let p1 = m - 1, p2 = n - 1;
    let p = m + n - 1;
    while (p2 >= 0) {
        if (p1 >= 0 && nums1[p1] > nums2[p2]) {
            nums1[p] = nums1[p1];
            p1--;
        } else {
            nums1[p] = nums2[p2];
            p2--;
        }
        p--;
    }
};`,
  'lc-014': `var removeDuplicates = function(nums) {
    if (nums.length === 0) return 0;
    let slow = 0;
    for (let fast = 1; fast < nums.length; fast++) {
        if (nums[fast] !== nums[slow]) {
            slow++;
            nums[slow] = nums[fast];
        }
    }
    return slow + 1;
};`,
  'lc-015': `var removeElement = function(nums, val) {
    let slow = 0;
    for (let fast = 0; fast < nums.length; fast++) {
        if (nums[fast] !== val) {
            nums[slow] = nums[fast];
            slow++;
        }
    }
    return slow;
};`,
  'lc-016': `var twoSum = function(numbers, target) {
    let l = 0, r = numbers.length - 1;
    while (l < r) {
        const sum = numbers[l] + numbers[r];
        if (sum === target) {
            return [l + 1, r + 1];
        } else if (sum < target) {
            l++;
        } else {
            r--;
        }
    }
    return [];
};`,
  'lc-017': `var reverseString = function(s) {
    let l = 0, r = s.length - 1;
    while (l < r) {
        [s[l], s[r]] = [s[r], s[l]];
        l++;
        r--;
    }
};`,
  'lc-018': `var longestPalindrome = function(s) {
    let start = 0, maxLen = 0;
    const n = s.length;
    for (let i = 0; i < n; i++) {
        let l = i, r = i;
        while (l >= 0 && r < n && s[l] === s[r]) {
            if (r - l + 1 > maxLen) {
                maxLen = r - l + 1;
                start = l;
            }
            l--;
            r++;
        }
        l = i;
        r = i + 1;
        while (l >= 0 && r < n && s[l] === s[r]) {
            if (r - l + 1 > maxLen) {
                maxLen = r - l + 1;
                start = l;
            }
            l--;
            r++;
        }
    }
    return s.substring(start, start + maxLen);
};`,
  'lc-019': `var lengthOfLongestSubstring = function(s) {
    const seen = new Set();
    let l = 0, ans = 0;
    for (let r = 0; r < s.length; r++) {
        while (seen.has(s[r])) {
            seen.delete(s[l]);
            l++;
        }
        seen.add(s[r]);
        ans = Math.max(ans, r - l + 1);
    }
    return ans;
};`,
  'lc-020': `var findAnagrams = function(s, p) {
    const need = new Map();
    const window = new Map();
    for (const c of p) {
        need.set(c, (need.get(c) || 0) + 1);
    }
    let l = 0, valid = 0;
    const res = [];
    for (let r = 0; r < s.length; r++) {
        const c = s[r];
        if (need.has(c)) {
            window.set(c, (window.get(c) || 0) + 1);
            if (window.get(c) === need.get(c)) {
                valid++;
            }
        }
        if (r - l + 1 === p.length) {
            if (valid === need.size) {
                res.push(l);
            }
            const d = s[l];
            if (need.has(d)) {
                if (window.get(d) === need.get(d)) {
                    valid--;
                }
                window.set(d, window.get(d) - 1);
            }
            l++;
        }
    }
    return res;
};`,
  'lc-021': `var minWindow = function(s, t) {
    const need = new Map();
    const window = new Map();
    for (const c of t) {
        need.set(c, (need.get(c) || 0) + 1);
    }
    let l = 0, valid = 0;
    let start = 0, minLen = Infinity;
    for (let r = 0; r < s.length; r++) {
        const c = s[r];
        if (need.has(c)) {
            window.set(c, (window.get(c) || 0) + 1);
            if (window.get(c) === need.get(c)) {
                valid++;
            }
        }
        while (valid === need.size) {
            if (r - l + 1 < minLen) {
                minLen = r - l + 1;
                start = l;
            }
            const d = s[l];
            if (need.has(d)) {
                if (window.get(d) === need.get(d)) {
                    valid--;
                }
                window.set(d, window.get(d) - 1);
            }
            l++;
        }
    }
    return minLen === Infinity ? "" : s.substring(start, start + minLen);
};`,
  'lc-022': `var maxSlidingWindow = function(nums, k) {
    const q = [];
    const res = [];
    for (let r = 0; r < nums.length; r++) {
        if (q.length && q[0] < r - k + 1) {
            q.shift();
        }
        while (q.length && nums[q[q.length - 1]] < nums[r]) {
            q.pop();
        }
        q.push(r);
        if (r >= k - 1) {
            res.push(nums[q[0]]);
        }
    }
    return res;
};`,
  'lc-023': `var checkInclusion = function(s1, s2) {
    const need = new Map();
    const window = new Map();
    for (const c of s1) {
        need.set(c, (need.get(c) || 0) + 1);
    }
    let l = 0, valid = 0;
    for (let r = 0; r < s2.length; r++) {
        const c = s2[r];
        if (need.has(c)) {
            window.set(c, (window.get(c) || 0) + 1);
            if (window.get(c) === need.get(c)) {
                valid++;
            }
        }
        if (r - l + 1 === s1.length) {
            if (valid === need.size) {
                return true;
            }
            const d = s2[l];
            if (need.has(d)) {
                if (window.get(d) === need.get(d)) {
                    valid--;
                }
                window.set(d, window.get(d) - 1);
            }
            l++;
        }
    }
    return false;
};`,
  'lc-024': `var search = function(nums, target) {
    let l = 0, r = nums.length - 1;
    while (l <= r) {
        const mid = Math.floor((l + r) / 2);
        if (nums[mid] === target) {
            return mid;
        }
        if (nums[l] <= nums[mid]) {
            if (nums[l] <= target && target < nums[mid]) {
                r = mid - 1;
            } else {
                l = mid + 1;
            }
        } else {
            if (nums[mid] < target && target <= nums[r]) {
                l = mid + 1;
            } else {
                r = mid - 1;
            }
        }
    }
    return -1;
};`,
  'lc-025': `var searchRange = function(nums, target) {
    const leftBound = () => {
        let l = 0, r = nums.length - 1;
        while (l <= r) {
            const mid = Math.floor((l + r) / 2);
            if (nums[mid] < target) {
                l = mid + 1;
            } else {
                r = mid - 1;
            }
        }
        if (l < nums.length && nums[l] === target) return l;
        return -1;
    };

    const rightBound = () => {
        let l = 0, r = nums.length - 1;
        while (l <= r) {
            const mid = Math.floor((l + r) / 2);
            if (nums[mid] <= target) {
                l = mid + 1;
            } else {
                r = mid - 1;
            }
        }
        if (r >= 0 && nums[r] === target) return r;
        return -1;
    };

    return [leftBound(), rightBound()];
};`,
  'lc-026': `var searchMatrix = function(matrix, target) {
    const m = matrix.length, n = matrix[0].length;
    let l = 0, r = m * n - 1;
    while (l <= r) {
        const mid = Math.floor((l + r) / 2);
        const val = matrix[Math.floor(mid / n)][mid % n];
        if (val === target) return true;
        else if (val < target) l = mid + 1;
        else r = mid - 1;
    }
    return false;
};`,
  'lc-027': `var findMin = function(nums) {
    let l = 0, r = nums.length - 1;
    while (l < r) {
        const mid = Math.floor((l + r) / 2);
        if (nums[mid] < nums[r]) r = mid;
        else l = mid + 1;
    }
    return nums[l];
};`,
  'lc-028': `var isValid = function(s) {
    const stack = [];
    for (const c of s) {
        if (c === '(' || c === '{' || c === '[') {
            stack.push(c);
        } else {
            if (stack.length === 0) return false;
            const top = stack.pop();
            if (c === ')' && top !== '(') return false;
            if (c === '}' && top !== '{') return false;
            if (c === ']' && top !== '[') return false;
        }
    }
    return stack.length === 0;
};`,
  'lc-029': `var MinStack = function() {
    this.stack = [];
    this.minStack = [];
};

MinStack.prototype.push = function(val) {
    this.stack.push(val);
    if (this.minStack.length === 0 || val <= this.minStack[this.minStack.length - 1]) {
        this.minStack.push(val);
    }
};

MinStack.prototype.pop = function() {
    if (this.stack.pop() === this.minStack[this.minStack.length - 1]) {
        this.minStack.pop();
    }
};

MinStack.prototype.top = function() {
    return this.stack[this.stack.length - 1];
};

MinStack.prototype.getMin = function() {
    return this.minStack[this.minStack.length - 1];
};`,
  'lc-030': `var dailyTemperatures = function(temperatures) {
    const n = temperatures.length;
    const ans = new Array(n).fill(0);
    const stack = [];
    for (let i = 0; i < n; i++) {
        while (stack.length > 0 && temperatures[i] > temperatures[stack[stack.length - 1]]) {
            const prev = stack.pop();
            ans[prev] = i - prev;
        }
        stack.push(i);
    }
    return ans;
};`,
  'lc-031': `var decodeString = function(s) {
    const numStack = [];
    const strStack = [];
    let cur = '';
    let num = 0;
    for (const c of s) {
        if (!isNaN(c)) {
            num = num * 10 + Number(c);
        } else if (c === '[') {
            numStack.push(num);
            strStack.push(cur);
            num = 0;
            cur = '';
        } else if (c === ']') {
            const repeat = numStack.pop();
            const prev = strStack.pop();
            cur = prev + cur.repeat(repeat);
        } else {
            cur += c;
        }
    }
    return cur;
};`,
  'lc-032': `var hasCycle = function(head) {
    let slow = head, fast = head;
    while (fast && fast.next) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow === fast) return true;
    }
    return false;
};`,
  'lc-033': `var reverseList = function(head) {
    let prev = null, curr = head;
    while (curr) {
        const next = curr.next;
        curr.next = prev;
        prev = curr;
        curr = next;
    }
    return prev;
};`,
  'lc-034': `var getIntersectionNode = function(headA, headB) {
    let pA = headA, pB = headB;
    while (pA !== pB) {
        pA = pA ? pA.next : headB;
        pB = pB ? pB.next : headA;
    }
    return pA;
};`,
  'lc-035': `var mergeKLists = function(lists) {
    const pq = new MinPriorityQueue({ priority: node => node.val });
    for (const node of lists) {
        if (node) pq.enqueue(node);
    }
    const dummy = new ListNode(0);
    let cur = dummy;
    while (!pq.isEmpty()) {
        const node = pq.dequeue().element;
        cur.next = node;
        cur = cur.next;
        if (node.next) pq.enqueue(node.next);
    }
    return dummy.next;
};`,
  'lc-036': `var addTwoNumbers = function(l1, l2) {
    const dummy = new ListNode(0);
    let cur = dummy, carry = 0;
    while (l1 || l2 || carry) {
        const val1 = l1 ? l1.val : 0;
        const val2 = l2 ? l2.val : 0;
        const total = val1 + val2 + carry;
        carry = Math.floor(total / 10);
        cur.next = new ListNode(total % 10);
        cur = cur.next;
        if (l1) l1 = l1.next;
        if (l2) l2 = l2.next;
    }
    return dummy.next;
};`,
  'lc-037': `var removeNthFromEnd = function(head, n) {
    const dummy = new ListNode(0, head);
    let slow = dummy, fast = dummy;
    for (let i = 0; i < n; i++) fast = fast.next;
    while (fast.next) {
        slow = slow.next;
        fast = fast.next;
    }
    slow.next = slow.next.next;
    return dummy.next;
};`,
  'lc-038': `var mergeTwoLists = function(list1, list2) {
    const dummy = new ListNode(0);
    let cur = dummy;
    while (list1 && list2) {
        if (list1.val < list2.val) {
            cur.next = list1;
            list1 = list1.next;
        } else {
            cur.next = list2;
            list2 = list2.next;
        }
        cur = cur.next;
    }
    cur.next = list1 || list2;
    return dummy.next;
};`,
  'lc-039': `var isPalindrome = function(head) {
    let slow = head, fast = head;
    while (fast && fast.next) {
        slow = slow.next;
        fast = fast.next.next;
    }
    let prev = null;
    while (slow) {
        const next = slow.next;
        slow.next = prev;
        prev = slow;
        slow = next;
    }
    let left = head, right = prev;
    while (right) {
        if (left.val !== right.val) return false;
        left = left.next;
        right = right.next;
    }
    return true;
};`,
  'lc-040': `var inorderTraversal = function(root) {
    const res = [];
    const stack = [];
    let cur = root;
    while (cur || stack.length > 0) {
        while (cur) {
            stack.push(cur);
            cur = cur.left;
        }
        cur = stack.pop();
        res.push(cur.val);
        cur = cur.right;
    }
    return res;
};`,
  'lc-041': `var maxDepth = function(root) {
    if (!root) return 0;
    return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
};`,
  'lc-042': `var invertTree = function(root) {
    if (!root) return null;
    [root.left, root.right] = [root.right, root.left];
    invertTree(root.left);
    invertTree(root.right);
    return root;
};`,
  'lc-043': `var levelOrder = function(root) {
    if (!root) return [];
    const res = [];
    const q = [root];
    while (q.length > 0) {
        const size = q.length;
        const level = [];
        for (let i = 0; i < size; i++) {
            const node = q.shift();
            level.push(node.val);
            if (node.left) q.push(node.left);
            if (node.right) q.push(node.right);
        }
        res.push(level);
    }
    return res;
};`,
  'lc-044': `var buildTree = function(preorder, inorder) {
    const inMap = new Map();
    for (let i = 0; i < inorder.length; i++) {
        inMap.set(inorder[i], i);
    }

    function build(preStart, preEnd, inStart, inEnd) {
        if (preStart > preEnd) return null;
        const rootVal = preorder[preStart];
        const root = new TreeNode(rootVal);
        const inRoot = inMap.get(rootVal);
        const leftSize = inRoot - inStart;
        root.left = build(preStart + 1, preStart + leftSize, inStart, inRoot - 1);
        root.right = build(preStart + leftSize + 1, preEnd, inRoot + 1, inEnd);
        return root;
    }

    return build(0, preorder.length - 1, 0, inorder.length - 1);
};`,
  'lc-045': `var isValidBST = function(root) {
    function validate(node, low, high) {
        if (!node) return true;
        if (node.val <= low || node.val >= high) return false;
        return validate(node.left, low, node.val) && validate(node.right, node.val, high);
    }
    return validate(root, -Infinity, Infinity);
};`,
  'lc-046': `var isSymmetric = function(root) {
    function isMirror(t1, t2) {
        if (!t1 && !t2) return true;
        if (!t1 || !t2) return false;
        return t1.val === t2.val && isMirror(t1.left, t2.right) && isMirror(t1.right, t2.left);
    }
    return isMirror(root, root);
};`,
  'lc-047': `var diameterOfBinaryTree = function(root) {
    let ans = 0;

    function depth(node) {
        if (!node) return 0;
        const left = depth(node.left);
        const right = depth(node.right);
        ans = Math.max(ans, left + right);
        return 1 + Math.max(left, right);
    }

    depth(root);
    return ans;
};`,
  'lc-048': `var flatten = function(root) {
    let cur = root;
    while (cur) {
        if (cur.left) {
            let pre = cur.left;
            while (pre.right) pre = pre.right;
            pre.right = cur.right;
            cur.right = cur.left;
            cur.left = null;
        }
        cur = cur.right;
    }
};`,
  'lc-049': `var lowestCommonAncestor = function(root, p, q) {
    if (!root || root === p || root === q) return root;
    const left = lowestCommonAncestor(root.left, p, q);
    const right = lowestCommonAncestor(root.right, p, q);
    if (left && right) return root;
    return left || right;
};`,
  'lc-050': `var maxPathSum = function(root) {
    let ans = -Infinity;

    function maxGain(node) {
        if (!node) return 0;
        const left = Math.max(maxGain(node.left), 0);
        const right = Math.max(maxGain(node.right), 0);
        ans = Math.max(ans, node.val + left + right);
        return node.val + Math.max(left, right);
    }

    maxGain(root);
    return ans;
};`,
  'lc-051': `var pathSum = function(root, targetSum) {
    const prefix = new Map();
    prefix.set(0, 1);

    function dfs(node, curSum) {
        if (!node) return 0;
        curSum += node.val;
        let ans = prefix.get(curSum - targetSum) || 0;
        prefix.set(curSum, (prefix.get(curSum) || 0) + 1);
        ans += dfs(node.left, curSum);
        ans += dfs(node.right, curSum);
        prefix.set(curSum, prefix.get(curSum) - 1);
        return ans;
    }

    return dfs(root, 0);
};`,
  'lc-052': `var numIslands = function(grid) {
    const m = grid.length, n = grid[0].length;
    let count = 0;

    function dfs(i, j) {
        if (i < 0 || i >= m || j < 0 || j >= n || grid[i][j] === '0') {
            return;
        }
        grid[i][j] = '0';
        dfs(i + 1, j);
        dfs(i - 1, j);
        dfs(i, j + 1);
        dfs(i, j - 1);
    }

    for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
            if (grid[i][j] === '1') {
                count++;
                dfs(i, j);
            }
        }
    }
    return count;
};`,
  'lc-053': `var canFinish = function(numCourses, prerequisites) {
    const graph = Array.from({ length: numCourses }, () => []);
    const indegree = new Array(numCourses).fill(0);
    for (const [a, b] of prerequisites) {
        graph[b].push(a);
        indegree[a]++;
    }
    const q = [];
    for (let i = 0; i < numCourses; i++) {
        if (indegree[i] === 0) q.push(i);
    }
    let count = 0;
    while (q.length) {
        const course = q.shift();
        count++;
        for (const nxt of graph[course]) {
            indegree[nxt]--;
            if (indegree[nxt] === 0) q.push(nxt);
        }
    }
    return count === numCourses;
};`,
  'lc-054': `var orangesRotting = function(grid) {
    const m = grid.length, n = grid[0].length;
    const q = [];
    let fresh = 0;
    for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
            if (grid[i][j] === 2) q.push([i, j]);
            else if (grid[i][j] === 1) fresh++;
        }
    }
    if (fresh === 0) return 0;
    let minutes = 0;
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    while (q.length && fresh > 0) {
        const size = q.length;
        for (let k = 0; k < size; k++) {
            const [i, j] = q.shift();
            for (const [di, dj] of dirs) {
                const ni = i + di, nj = j + dj;
                if (ni >= 0 && ni < m && nj >= 0 && nj < n && grid[ni][nj] === 1) {
                    grid[ni][nj] = 2;
                    fresh--;
                    q.push([ni, nj]);
                }
            }
        }
        minutes++;
    }
    return fresh === 0 ? minutes : -1;
};`,
  'lc-055': `var Trie = function() {
    this.root = Object.create(null);
};

Trie.prototype.insert = function(word) {
    let node = this.root;
    for (const ch of word) {
        if (!node[ch]) node[ch] = Object.create(null);
        node = node[ch];
    }
    node.isEnd = true;
};

Trie.prototype.search = function(word) {
    let node = this.root;
    for (const ch of word) {
        if (!node[ch]) return false;
        node = node[ch];
    }
    return node.isEnd === true;
};

Trie.prototype.startsWith = function(prefix) {
    let node = this.root;
    for (const ch of prefix) {
        if (!node[ch]) return false;
        node = node[ch];
    }
    return true;
};`,
  'lc-056': `var permute = function(nums) {
    const res = [];
    const used = new Array(nums.length).fill(false);

    function backtrack(path) {
        if (path.length === nums.length) {
            res.push([...path]);
            return;
        }
        for (let i = 0; i < nums.length; i++) {
            if (!used[i]) {
                used[i] = true;
                path.push(nums[i]);
                backtrack(path);
                path.pop();
                used[i] = false;
            }
        }
    }

    backtrack([]);
    return res;
};`,
  'lc-057': `var subsets = function(nums) {
    const res = [];

    function backtrack(start, path) {
        res.push([...path]);
        for (let i = start; i < nums.length; i++) {
            path.push(nums[i]);
            backtrack(i + 1, path);
            path.pop();
        }
    }

    backtrack(0, []);
    return res;
};`,
  'lc-058': `var exist = function(board, word) {
    const m = board.length, n = board[0].length;

    function dfs(i, j, idx) {
        if (idx === word.length) return true;
        if (i < 0 || i >= m || j < 0 || j >= n || board[i][j] !== word[idx]) {
            return false;
        }
        const temp = board[i][j];
        board[i][j] = '#';
        const found = dfs(i + 1, j, idx + 1)
                   || dfs(i - 1, j, idx + 1)
                   || dfs(i, j + 1, idx + 1)
                   || dfs(i, j - 1, idx + 1);
        board[i][j] = temp;
        return found;
    }

    for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
            if (dfs(i, j, 0)) return true;
        }
    }
    return false;
};`,
  'lc-059': `var solveNQueens = function(n) {
    const res = [];
    const board = Array.from({ length: n }, () => new Array(n).fill('.'));
    const cols = new Set();
    const diag1 = new Set();
    const diag2 = new Set();

    function backtrack(row) {
        if (row === n) {
            res.push(board.map(r => r.join('')));
            return;
        }
        for (let col = 0; col < n; col++) {
            if (cols.has(col) || diag1.has(row - col) || diag2.has(row + col)) continue;
            board[row][col] = 'Q';
            cols.add(col);
            diag1.add(row - col);
            diag2.add(row + col);
            backtrack(row + 1);
            board[row][col] = '.';
            cols.delete(col);
            diag1.delete(row - col);
            diag2.delete(row + col);
        }
    }

    backtrack(0);
    return res;
};`,
  'lc-060': `var generateParenthesis = function(n) {
    const res = [];

    function backtrack(s, left, right) {
        if (left === 0 && right === 0) {
            res.push(s);
            return;
        }
        if (left > 0) {
            backtrack(s + '(', left - 1, right);
        }
        if (right > left) {
            backtrack(s + ')', left, right - 1);
        }
    }

    backtrack('', n, n);
    return res;
};`,
  'lc-061': `var combinationSum = function(candidates, target) {
    const res = [];

    function backtrack(start, path, remain) {
        if (remain === 0) {
            res.push([...path]);
            return;
        }
        if (remain < 0) return;
        for (let i = start; i < candidates.length; i++) {
            path.push(candidates[i]);
            backtrack(i, path, remain - candidates[i]);
            path.pop();
        }
    }

    backtrack(0, [], target);
    return res;
};`,
  'lc-062': `var climbStairs = function(n) {
    if (n <= 2) return n;
    let a = 1, b = 2;
    for (let i = 3; i <= n; i++) {
        [a, b] = [b, a + b];
    }
    return b;
};`,
  'lc-063': `var maxSubArray = function(nums) {
    let curMax = nums[0], globalMax = nums[0];
    for (let i = 1; i < nums.length; i++) {
        curMax = Math.max(nums[i], curMax + nums[i]);
        globalMax = Math.max(globalMax, curMax);
    }
    return globalMax;
};`,
  'lc-064': `var lengthOfLIS = function(nums) {
    const tails = [];
    for (const x of nums) {
        let l = 0, r = tails.length;
        while (l < r) {
            const mid = Math.floor((l + r) / 2);
            if (tails[mid] < x) {
                l = mid + 1;
            } else {
                r = mid;
            }
        }
        if (l === tails.length) {
            tails.push(x);
        } else {
            tails[l] = x;
        }
    }
    return tails.length;
};`,
  'lc-065': `var coinChange = function(coins, amount) {
    const max = amount + 1;
    const dp = new Array(amount + 1).fill(max);
    dp[0] = 0;
    for (let i = 1; i <= amount; i++) {
        for (const coin of coins) {
            if (i >= coin) {
                dp[i] = Math.min(dp[i], dp[i - coin] + 1);
            }
        }
    }
    return dp[amount] === max ? -1 : dp[amount];
};`,
  'lc-066': `var longestCommonSubsequence = function(text1, text2) {
    const m = text1.length, n = text2.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (text1[i - 1] === text2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }
    return dp[m][n];
};`,
  'lc-067': `var rob = function(nums) {
        if (nums.length === 0) return 0;
        if (nums.length === 1) return nums[0];
        let prev2 = nums[0], prev1 = Math.max(nums[0], nums[1]);
        for (let i = 2; i < nums.length; i++) {
            const cur = Math.max(prev1, prev2 + nums[i]);
            prev2 = prev1;
            prev1 = cur;
        }
        return prev1;
    };`,
  'lc-068': `var numSquares = function(n) {
    const dp = new Array(n + 1).fill(Infinity);
    dp[0] = 0;
    for (let i = 1; i <= n; i++) {
        for (let j = 1; j * j <= i; j++) {
            dp[i] = Math.min(dp[i], dp[i - j * j] + 1);
        }
    }
    return dp[n];
};`,
  'lc-069': `var uniquePaths = function(m, n) {
    const dp = new Array(n).fill(1);
    for (let i = 1; i < m; i++) {
        for (let j = 1; j < n; j++) {
            dp[j] += dp[j - 1];
        }
    }
    return dp[n - 1];
};`,
  'lc-070': `var minPathSum = function(grid) {
    const m = grid.length, n = grid[0].length;
    for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
            if (i === 0 && j === 0) continue;
            else if (i === 0) grid[i][j] += grid[i][j - 1];
            else if (j === 0) grid[i][j] += grid[i - 1][j];
            else grid[i][j] += Math.min(grid[i - 1][j], grid[i][j - 1]);
        }
    }
    return grid[m - 1][n - 1];
};`,
  'lc-071': `var minDistance = function(word1, word2) {
    const m = word1.length, n = word2.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (word1[i - 1] === word2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1];
            } else {
                dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
            }
        }
    }
    return dp[m][n];
};`,
  'lc-072': `var wordBreak = function(s, wordDict) {
    const wordSet = new Set(wordDict);
    const n = s.length;
    const dp = new Array(n + 1).fill(false);
    dp[0] = true;
    for (let i = 1; i <= n; i++) {
        for (let j = 0; j < i; j++) {
            if (dp[j] && wordSet.has(s.substring(j, i))) {
                dp[i] = true;
                break;
            }
        }
    }
    return dp[n];
};`,
  'lc-073': `var maxProduct = function(nums) {
    let curMax = nums[0], curMin = nums[0], ans = nums[0];
    for (let i = 1; i < nums.length; i++) {
        const tmpMax = Math.max(nums[i], nums[i] * curMax, nums[i] * curMin);
        curMin = Math.min(nums[i], nums[i] * curMax, nums[i] * curMin);
        curMax = tmpMax;
        ans = Math.max(ans, curMax);
    }
    return ans;
};`,
  'lc-074': `var canPartition = function(nums) {
    const total = nums.reduce((a, b) => a + b, 0);
    if (total % 2 !== 0) return false;
    const target = total / 2;
    const dp = new Array(target + 1).fill(false);
    dp[0] = true;
    for (const num of nums) {
        for (let i = target; i >= num; i--) {
            dp[i] = dp[i] || dp[i - num];
        }
    }
    return dp[target];
};`,
  'lc-075': `var longestValidParentheses = function(s) {
    const stack = [-1];
    let ans = 0;
    for (let i = 0; i < s.length; i++) {
        if (s[i] === '(') {
            stack.push(i);
        } else {
            stack.pop();
            if (stack.length === 0) {
                stack.push(i);
            } else {
                ans = Math.max(ans, i - stack[stack.length - 1]);
            }
        }
    }
    return ans;
};`,
  'lc-076': `var maxCoins = function(nums) {
    const points = [1, ...nums, 1];
    const n = points.length;
    const dp = Array.from({ length: n }, () => Array(n).fill(0));
    for (let len = 2; len < n; len++) {
        for (let i = 0; i + len < n; i++) {
            const j = i + len;
            for (let k = i + 1; k < j; k++) {
                dp[i][j] = Math.max(dp[i][j],
                    dp[i][k] + dp[k][j] + points[i] * points[k] * points[j]);
            }
        }
    }
    return dp[0][n - 1];
};`,
  'lc-077': `var isMatch = function(s, p) {
    const m = s.length, n = p.length;
    const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(false));
    dp[0][0] = true;
    for (let j = 2; j <= n; j++) {
        if (p[j - 1] === '*') {
            dp[0][j] = dp[0][j - 2];
        }
    }
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (p[j - 1] !== '*') {
                if (p[j - 1] === '.' || s[i - 1] === p[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1];
                }
            } else {
                dp[i][j] = dp[i][j - 2];
                if (p[j - 2] === '.' || s[i - 1] === p[j - 2]) {
                    dp[i][j] = dp[i][j] || dp[i - 1][j];
                }
            }
        }
    }
    return dp[m][n];
};`,
  'lc-078': `var maxProfit = function(prices) {
    let minPrice = Infinity;
    let maxProfit = 0;
    for (const price of prices) {
        minPrice = Math.min(minPrice, price);
        maxProfit = Math.max(maxProfit, price - minPrice);
    }
    return maxProfit;
};`,
  'lc-079': `var canJump = function(nums) {
    let maxReach = 0;
    for (let i = 0; i < nums.length; i++) {
        if (i > maxReach) {
            return false;
        }
        maxReach = Math.max(maxReach, i + nums[i]);
        if (maxReach >= nums.length - 1) {
            return true;
        }
    }
    return true;
};`,
  'lc-080': `var jump = function(nums) {
    const n = nums.length;
    if (n === 1) return 0;
    let jumps = 0;
    let curEnd = 0;
    let curFarthest = 0;
    for (let i = 0; i < n - 1; i++) {
        curFarthest = Math.max(curFarthest, i + nums[i]);
        if (i === curEnd) {
            jumps++;
            curEnd = curFarthest;
        }
    }
    return jumps;
};`,
  'lc-081': `var findKthLargest = function(nums, k) {
    const heap = [];
    for (const num of nums) {
        heap.push(num);
        heap.sort((a, b) => a - b);
        if (heap.length > k) {
            heap.shift();
        }
    }
    return heap[0];
};`,
  'lc-082': `var topKFrequent = function(nums, k) {
    const freq = new Map();
    for (const num of nums) {
        freq.set(num, (freq.get(num) || 0) + 1);
    }
    const bucket = Array.from({ length: nums.length + 1 }, () => []);
    for (const [num, f] of freq) {
        bucket[f].push(num);
    }
    const res = [];
    for (let i = bucket.length - 1; i >= 0 && res.length < k; i--) {
        res.push(...bucket[i]);
    }
    return res.slice(0, k);
};`,
  'lc-083': `var MedianFinder = function() {
    this.small = []; // max heap (store negatives)
    this.large = []; // min heap
};

MedianFinder.prototype.addNum = function(num) {
    this.small.push(-num);
    this.small.sort((a, b) => a - b);
    this.large.push(-this.small.pop());
    this.large.sort((a, b) => a - b);
    if (this.large.length > this.small.length) {
        this.small.push(-this.large.shift());
        this.small.sort((a, b) => a - b);
    }
};

MedianFinder.prototype.findMedian = function() {
    if (this.small.length > this.large.length) {
        return -this.small[0];
    }
    return (-this.small[0] + this.large[0]) / 2;
};`,
  'lc-084': `var merge = function(intervals) {
    intervals.sort((a, b) => a[0] - b[0]);
    const res = [];
    for (const interval of intervals) {
        if (res.length === 0 || res[res.length - 1][1] < interval[0]) {
            res.push(interval);
        } else {
            res[res.length - 1][1] = Math.max(res[res.length - 1][1], interval[1]);
        }
    }
    return res;
};`,
  'lc-085': `var sortColors = function(nums) {
    let p0 = 0, cur = 0, p2 = nums.length - 1;
    while (cur <= p2) {
        if (nums[cur] === 0) {
            [nums[p0], nums[cur]] = [nums[cur], nums[p0]];
            p0++;
            cur++;
        } else if (nums[cur] === 2) {
            [nums[cur], nums[p2]] = [nums[p2], nums[cur]];
            p2--;
        } else {
            cur++;
        }
    }
};`,
  'lc-086': `var sortList = function(head) {
    if (!head || !head.next) return head;
    let slow = head, fast = head.next;
    while (fast && fast.next) {
        slow = slow.next;
        fast = fast.next.next;
    }
    const mid = slow.next;
    slow.next = null;
    const left = sortList(head);
    const right = sortList(mid);
    return merge(left, right);
};

var merge = function(l1, l2) {
    const dummy = new ListNode(0);
    let cur = dummy;
    while (l1 && l2) {
        if (l1.val < l2.val) {
            cur.next = l1;
            l1 = l1.next;
        } else {
            cur.next = l2;
            l2 = l2.next;
        }
        cur = cur.next;
    }
    cur.next = l1 || l2;
    return dummy.next;
};`,
  'lc-087': `var LRUCache = function(capacity) {
    this.cap = capacity;
    this.cache = new Map();
};

LRUCache.prototype.get = function(key) {
    if (this.cache.has(key)) {
        const val = this.cache.get(key);
        this.cache.delete(key);
        this.cache.set(key, val);
        return val;
    }
    return -1;
};

LRUCache.prototype.put = function(key, value) {
    if (this.cache.has(key)) {
        this.cache.delete(key);
    }
    this.cache.set(key, value);
    if (this.cache.size > this.cap) {
        this.cache.delete(this.cache.keys().next().value);
    }
};`,
  'lc-088': `var RandomizedSet = function() {
    this.nums = [];
    this.pos = new Map();
};

RandomizedSet.prototype.insert = function(val) {
    if (this.pos.has(val)) return false;
    this.pos.set(val, this.nums.length);
    this.nums.push(val);
    return true;
};

RandomizedSet.prototype.remove = function(val) {
    if (!this.pos.has(val)) return false;
    const idx = this.pos.get(val);
    const last = this.nums[this.nums.length - 1];
    this.nums[idx] = last;
    this.pos.set(last, idx);
    this.nums.pop();
    this.pos.delete(val);
    return true;
};

RandomizedSet.prototype.getRandom = function() {
    return this.nums[Math.floor(Math.random() * this.nums.length)];
};`,
  'lc-089': `var singleNumber = function(nums) {
    let res = 0;
    for (const num of nums) {
        res ^= num;
    }
    return res;
};`,
  'lc-090': `var majorityElement = function(nums) {
    let candidate = null;
    let count = 0;
    for (const num of nums) {
        if (count === 0) {
            candidate = num;
        }
        count += (num === candidate) ? 1 : -1;
    }
    return candidate;
};`,
  'lc-091': `var productExceptSelf = function(nums) {
    const n = nums.length;
    const ans = new Array(n).fill(1);
    for (let i = 1; i < n; i++) {
        ans[i] = ans[i - 1] * nums[i - 1];
    }
    let suffix = 1;
    for (let i = n - 1; i >= 0; i--) {
        ans[i] *= suffix;
        suffix *= nums[i];
    }
    return ans;
};`,
  'lc-092': `var nextPermutation = function(nums) {
    const n = nums.length;
    let i = n - 2;
    while (i >= 0 && nums[i] >= nums[i + 1]) {
        i--;
    }
    if (i >= 0) {
        let j = n - 1;
        while (nums[j] <= nums[i]) {
            j--;
        }
        [nums[i], nums[j]] = [nums[j], nums[i]];
    }
    let l = i + 1, r = n - 1;
    while (l < r) {
        [nums[l], nums[r]] = [nums[r], nums[l]];
        l++;
        r--;
    }
};`,
  'lc-093': `var findDuplicate = function(nums) {
    let slow = nums[0], fast = nums[0];
    do {
        slow = nums[slow];
        fast = nums[nums[fast]];
    } while (slow !== fast);
    slow = nums[0];
    while (slow !== fast) {
        slow = nums[slow];
        fast = nums[fast];
    }
    return slow;
};`,
  'lc-094': `var searchMatrix = function(matrix, target) {
    const m = matrix.length, n = matrix[0].length;
    let i = 0, j = n - 1;
    while (i < m && j >= 0) {
        if (matrix[i][j] === target) {
            return true;
        } else if (matrix[i][j] > target) {
            j--;
        } else {
            i++;
        }
    }
    return false;
};`,
  'lc-095': `var rotate = function(nums, k) {
    const n = nums.length;
    k %= n;
    const rev = (l, r) => {
        while (l < r) {
            [nums[l], nums[r]] = [nums[r], nums[l]];
            l++;
            r--;
        }
    };
    rev(0, n - 1);
    rev(0, k - 1);
    rev(k, n - 1);
};`,
  'lc-096': `var sortedArrayToBST = function(nums) {
    const build = (l, r) => {
        if (l > r) return null;
        const mid = l + Math.floor((r - l) / 2);
        const root = new TreeNode(nums[mid]);
        root.left = build(l, mid - 1);
        root.right = build(mid + 1, r);
        return root;
    };
    return build(0, nums.length - 1);
};`,
  'lc-097': `var generate = function(numRows) {
    const res = [];
    for (let i = 0; i < numRows; i++) {
        const row = new Array(i + 1).fill(1);
        for (let j = 1; j < i; j++) {
            row[j] = res[i - 1][j - 1] + res[i - 1][j];
        }
        res.push(row);
    }
    return res;
};`,
  'lc-098': `var findDisappearedNumbers = function(nums) {
    for (const num of nums) {
        const idx = Math.abs(num) - 1;
        nums[idx] = -Math.abs(nums[idx]);
    }
    const res = [];
    for (let i = 0; i < nums.length; i++) {
        if (nums[i] > 0) {
            res.push(i + 1);
        }
    }
    return res;
};`,
  'lc-099': `var letterCombinations = function(digits) {
    if (!digits) return [];
    const mapping = {
        '2': 'abc', '3': 'def', '4': 'ghi', '5': 'jkl',
        '6': 'mno', '7': 'pqrs', '8': 'tuv', '9': 'wxyz'
    };
    const res = [];
    const backtrack = (idx, path) => {
        if (idx === digits.length) {
            res.push(path.join(''));
            return;
        }
        for (const ch of mapping[digits[idx]]) {
            path.push(ch);
            backtrack(idx + 1, path);
            path.pop();
        }
    };
    backtrack(0, []);
    return res;
};`,
  'lc-100': `var countBits = function(n) {
    const dp = new Array(n + 1).fill(0);
    for (let i = 1; i <= n; i++) {
        dp[i] = dp[i >> 1] + (i & 1);
    }
    return dp;
};`
};
