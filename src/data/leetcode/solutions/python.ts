// Auto-generated from leetcode-hot100.ts — python solutions
// DO NOT EDIT MANUALLY

export const pythonSolutions: Record<string, string> = {
  'lc-001': `def twoSum(nums: List[int], target: int) -> List[int]:
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            return [seen[diff], i]
        seen[num] = i
    return []`,
  'lc-002': `from collections import defaultdict

def groupAnagrams(strs: List[str]) -> List[List[str]]:
    groups = defaultdict(list)
    for s in strs:
        key = ''.join(sorted(s))
        groups[key].append(s)
    return list(groups.values())`,
  'lc-003': `def longestConsecutive(nums: List[int]) -> int:
    num_set = set(nums)
    longest = 0
    for num in num_set:
        if num - 1 not in num_set:
            cur = num
            streak = 1
            while cur + 1 in num_set:
                cur += 1
                streak += 1
            longest = max(longest, streak)
    return longest`,
  'lc-004': `from collections import defaultdict

def subarraySum(nums: List[int], k: int) -> int:
    count = defaultdict(int)
    count[0] = 1
    pre_sum = 0
    ans = 0
    for num in nums:
        pre_sum += num
        ans += count[pre_sum - k]
        count[pre_sum] += 1
    return ans`,
  'lc-005': `def moveZeroes(nums: List[int]) -> None:
    slow = 0
    for fast in range(len(nums)):
        if nums[fast] != 0:
            nums[slow], nums[fast] = nums[fast], nums[slow]
            slow += 1`,
  'lc-006': `def maxArea(height: List[int]) -> int:
    l, r = 0, len(height) - 1
    ans = 0
    while l < r:
        area = min(height[l], height[r]) * (r - l)
        ans = max(ans, area)
        if height[l] < height[r]:
            l += 1
        else:
            r -= 1
    return ans`,
  'lc-007': `def threeSum(nums: List[int]) -> List[List[int]]:
    nums.sort()
    n = len(nums)
    res = []
    for i in range(n - 2):
        if i > 0 and nums[i] == nums[i - 1]:
            continue
        l, r = i + 1, n - 1
        while l < r:
            s = nums[i] + nums[l] + nums[r]
            if s < 0:
                l += 1
            elif s > 0:
                r -= 1
            else:
                res.append([nums[i], nums[l], nums[r]])
                while l < r and nums[l] == nums[l + 1]:
                    l += 1
                while l < r and nums[r] == nums[r - 1]:
                    r -= 1
                l += 1
                r -= 1
    return res`,
  'lc-008': `def trap(height: List[int]) -> int:
    l, r = 0, len(height) - 1
    left_max = right_max = 0
    ans = 0
    while l < r:
        left_max = max(left_max, height[l])
        right_max = max(right_max, height[r])
        if height[l] < height[r]:
            ans += left_max - height[l]
            l += 1
        else:
            ans += right_max - height[r]
            r -= 1
    return ans`,
  'lc-009': `def firstMissingPositive(nums: List[int]) -> int:
    n = len(nums)
    for i in range(n):
        while 1 <= nums[i] <= n and nums[nums[i] - 1] != nums[i]:
            nums[nums[i] - 1], nums[i] = nums[i], nums[nums[i] - 1]
    for i in range(n):
        if nums[i] != i + 1:
            return i + 1
    return n + 1`,
  'lc-010': `def setZeroes(matrix: List[List[int]]) -> None:
    m, n = len(matrix), len(matrix[0])
    row0 = any(matrix[0][j] == 0 for j in range(n))
    col0 = any(matrix[i][0] == 0 for i in range(m))
    for i in range(1, m):
        for j in range(1, n):
            if matrix[i][j] == 0:
                matrix[i][0] = matrix[0][j] = 0
    for i in range(1, m):
        if matrix[i][0] == 0:
            for j in range(n):
                matrix[i][j] = 0
    for j in range(1, n):
        if matrix[0][j] == 0:
            for i in range(m):
                matrix[i][j] = 0
    if row0:
        for j in range(n):
            matrix[0][j] = 0
    if col0:
        for i in range(m):
            matrix[i][0] = 0`,
  'lc-011': `def spiralOrder(matrix: List[List[int]]) -> List[int]:
    res = []
    top, bottom = 0, len(matrix) - 1
    left, right = 0, len(matrix[0]) - 1
    while top <= bottom and left <= right:
        for j in range(left, right + 1):
            res.append(matrix[top][j])
        top += 1
        for i in range(top, bottom + 1):
            res.append(matrix[i][right])
        right -= 1
        if top <= bottom:
            for j in range(right, left - 1, -1):
                res.append(matrix[bottom][j])
            bottom -= 1
        if left <= right:
            for i in range(bottom, top - 1, -1):
                res.append(matrix[i][left])
            left += 1
    return res`,
  'lc-012': `def rotate(matrix: List[List[int]]) -> None:
    n = len(matrix)
    for i in range(n):
        for j in range(i + 1, n):
            matrix[i][j], matrix[j][i] = matrix[j][i], matrix[i][j]
    for row in matrix:
        row.reverse()`,
  'lc-013': `def merge(nums1: List[int], m: int, nums2: List[int], n: int) -> None:
    p1, p2 = m - 1, n - 1
    p = m + n - 1
    while p2 >= 0:
        if p1 >= 0 and nums1[p1] > nums2[p2]:
            nums1[p] = nums1[p1]
            p1 -= 1
        else:
            nums1[p] = nums2[p2]
            p2 -= 1
        p -= 1`,
  'lc-014': `def removeDuplicates(nums: List[int]) -> int:
    if not nums:
        return 0
    slow = 0
    for fast in range(1, len(nums)):
        if nums[fast] != nums[slow]:
            slow += 1
            nums[slow] = nums[fast]
    return slow + 1`,
  'lc-015': `def removeElement(nums: List[int], val: int) -> int:
    slow = 0
    for fast in range(len(nums)):
        if nums[fast] != val:
            nums[slow] = nums[fast]
            slow += 1
    return slow`,
  'lc-016': `def twoSum(numbers: List[int], target: int) -> List[int]:
    l, r = 0, len(numbers) - 1
    while l < r:
        s = numbers[l] + numbers[r]
        if s == target:
            return [l + 1, r + 1]
        elif s < target:
            l += 1
        else:
            r -= 1
    return []`,
  'lc-017': `def reverseString(s: List[str]) -> None:
    l, r = 0, len(s) - 1
    while l < r:
        s[l], s[r] = s[r], s[l]
        l += 1
        r -= 1`,
  'lc-018': `def longestPalindrome(s: str) -> str:
    start, max_len = 0, 0
    for i in range(len(s)):
        l, r = i, i
        while l >= 0 and r < len(s) and s[l] == s[r]:
            if r - l + 1 > max_len:
                max_len = r - l + 1
                start = l
            l -= 1
            r += 1
        l, r = i, i + 1
        while l >= 0 and r < len(s) and s[l] == s[r]:
            if r - l + 1 > max_len:
                max_len = r - l + 1
                start = l
            l -= 1
            r += 1
    return s[start:start + max_len]`,
  'lc-019': `def lengthOfLongestSubstring(s: str) -> int:
    seen = set()
    l = 0
    ans = 0
    for r in range(len(s)):
        while s[r] in seen:
            seen.remove(s[l])
            l += 1
        seen.add(s[r])
        ans = max(ans, r - l + 1)
    return ans`,
  'lc-020': `from collections import Counter

def findAnagrams(s: str, p: str) -> List[int]:
    need = Counter(p)
    window = Counter()
    l = 0
    valid = 0
    res = []
    for r in range(len(s)):
        c = s[r]
        if c in need:
            window[c] += 1
            if window[c] == need[c]:
                valid += 1
        if r - l + 1 == len(p):
            if valid == len(need):
                res.append(l)
            c = s[l]
            if c in need:
                if window[c] == need[c]:
                    valid -= 1
                window[c] -= 1
            l += 1
    return res`,
  'lc-021': `from collections import Counter

def minWindow(s: str, t: str) -> str:
    need = Counter(t)
    window = Counter()
    l = 0
    valid = 0
    start = 0
    min_len = float('inf')
    for r in range(len(s)):
        c = s[r]
        if c in need:
            window[c] += 1
            if window[c] == need[c]:
                valid += 1
        while valid == len(need):
            if r - l + 1 < min_len:
                min_len = r - l + 1
                start = l
            c = s[l]
            if c in need:
                if window[c] == need[c]:
                    valid -= 1
                window[c] -= 1
            l += 1
    return s[start:start + min_len] if min_len != float('inf') else ''`,
  'lc-022': `from collections import deque

def maxSlidingWindow(nums: List[int], k: int) -> List[int]:
    q = deque()
    res = []
    for r in range(len(nums)):
        if q and q[0] < r - k + 1:
            q.popleft()
        while q and nums[q[-1]] < nums[r]:
            q.pop()
        q.append(r)
        if r >= k - 1:
            res.append(nums[q[0]])
    return res`,
  'lc-023': `from collections import Counter

def checkInclusion(s1: str, s2: str) -> bool:
    need = Counter(s1)
    window = Counter()
    l = 0
    valid = 0
    for r in range(len(s2)):
        c = s2[r]
        if c in need:
            window[c] += 1
            if window[c] == need[c]:
                valid += 1
        if r - l + 1 == len(s1):
            if valid == len(need):
                return True
            c = s2[l]
            if c in need:
                if window[c] == need[c]:
                    valid -= 1
                window[c] -= 1
            l += 1
    return False`,
  'lc-024': `def search(nums: List[int], target: int) -> int:
    l, r = 0, len(nums) - 1
    while l <= r:
        mid = (l + r) // 2
        if nums[mid] == target:
            return mid
        if nums[l] <= nums[mid]:
            if nums[l] <= target < nums[mid]:
                r = mid - 1
            else:
                l = mid + 1
        else:
            if nums[mid] < target <= nums[r]:
                l = mid + 1
            else:
                r = mid - 1
    return -1`,
  'lc-025': `def searchRange(nums: List[int], target: int) -> List[int]:
    def left_bound():
        l, r = 0, len(nums) - 1
        while l <= r:
            mid = (l + r) // 2
            if nums[mid] < target:
                l = mid + 1
            else:
                r = mid - 1
        return l if l < len(nums) and nums[l] == target else -1

    def right_bound():
        l, r = 0, len(nums) - 1
        while l <= r:
            mid = (l + r) // 2
            if nums[mid] <= target:
                l = mid + 1
            else:
                r = mid - 1
        return r if r >= 0 and nums[r] == target else -1

    return [left_bound(), right_bound()]`,
  'lc-026': `def searchMatrix(matrix: List[List[int]], target: int) -> bool:
    m, n = len(matrix), len(matrix[0])
    l, r = 0, m * n - 1
    while l <= r:
        mid = (l + r) // 2
        val = matrix[mid // n][mid % n]
        if val == target:
            return True
        elif val < target:
            l = mid + 1
        else:
            r = mid - 1
    return False`,
  'lc-027': `def findMin(nums: List[int]) -> int:
    l, r = 0, len(nums) - 1
    while l < r:
        mid = (l + r) // 2
        if nums[mid] < nums[r]:
            r = mid
        else:
            l = mid + 1
    return nums[l]`,
  'lc-028': `def isValid(s: str) -> bool:
    stack = []
    pairs = {')': '(', '}': '{', ']': '['}
    for c in s:
        if c in pairs:
            if not stack or stack[-1] != pairs[c]:
                return False
            stack.pop()
        else:
            stack.append(c)
    return len(stack) == 0`,
  'lc-029': `class MinStack:
    def __init__(self):
        self.stack = []
        self.min_stack = []

    def push(self, val: int) -> None:
        self.stack.append(val)
        if not self.min_stack or val <= self.min_stack[-1]:
            self.min_stack.append(val)

    def pop(self) -> None:
        if self.stack.pop() == self.min_stack[-1]:
            self.min_stack.pop()

    def top(self) -> int:
        return self.stack[-1]

    def getMin(self) -> int:
        return self.min_stack[-1]`,
  'lc-030': `def dailyTemperatures(temperatures: List[int]) -> List[int]:
    n = len(temperatures)
    ans = [0] * n
    stack = []
    for i, temp in enumerate(temperatures):
        while stack and temp > temperatures[stack[-1]]:
            prev = stack.pop()
            ans[prev] = i - prev
        stack.append(i)
    return ans`,
  'lc-031': `def decodeString(s: str) -> str:
    num_stack = []
    str_stack = []
    cur_str = ''
    cur_num = 0
    for c in s:
        if c.isdigit():
            cur_num = cur_num * 10 + int(c)
        elif c == '[':
            num_stack.append(cur_num)
            str_stack.append(cur_str)
            cur_num = 0
            cur_str = ''
        elif c == ']':
            num = num_stack.pop()
            prev_str = str_stack.pop()
            cur_str = prev_str + num * cur_str
        else:
            cur_str += c
    return cur_str`,
  'lc-032': `def hasCycle(head: Optional[ListNode]) -> bool:
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow == fast:
            return True
    return False`,
  'lc-033': `def reverseList(head: Optional[ListNode]) -> Optional[ListNode]:
    prev = None
    curr = head
    while curr:
        nxt = curr.next
        curr.next = prev
        prev = curr
        curr = nxt
    return prev`,
  'lc-034': `def getIntersectionNode(headA: ListNode, headB: ListNode) -> Optional[ListNode]:
    pA, pB = headA, headB
    while pA != pB:
        pA = pA.next if pA else headB
        pB = pB.next if pB else headA
    return pA`,
  'lc-035': `import heapq

def mergeKLists(lists: List[Optional[ListNode]]) -> Optional[ListNode]:
    heap = []
    for i, node in enumerate(lists):
        if node:
            heapq.heappush(heap, (node.val, i, node))
    dummy = ListNode()
    cur = dummy
    while heap:
        val, i, node = heapq.heappop(heap)
        cur.next = node
        cur = cur.next
        if node.next:
            heapq.heappush(heap, (node.next.val, i, node.next))
    return dummy.next`,
  'lc-036': `def addTwoNumbers(l1: Optional[ListNode], l2: Optional[ListNode]) -> Optional[ListNode]:
    dummy = ListNode()
    cur = dummy
    carry = 0
    while l1 or l2 or carry:
        val1 = l1.val if l1 else 0
        val2 = l2.val if l2 else 0
        total = val1 + val2 + carry
        carry = total // 10
        cur.next = ListNode(total % 10)
        cur = cur.next
        l1 = l1.next if l1 else None
        l2 = l2.next if l2 else None
    return dummy.next`,
  'lc-037': `def removeNthFromEnd(head: Optional[ListNode], n: int) -> Optional[ListNode]:
    dummy = ListNode(0, head)
    slow = fast = dummy
    for _ in range(n):
        fast = fast.next
    while fast.next:
        slow = slow.next
        fast = fast.next
    slow.next = slow.next.next
    return dummy.next`,
  'lc-038': `def mergeTwoLists(list1: Optional[ListNode], list2: Optional[ListNode]) -> Optional[ListNode]:
    dummy = ListNode()
    cur = dummy
    while list1 and list2:
        if list1.val < list2.val:
            cur.next = list1
            list1 = list1.next
        else:
            cur.next = list2
            list2 = list2.next
        cur = cur.next
    cur.next = list1 if list1 else list2
    return dummy.next`,
  'lc-039': `def isPalindrome(head: Optional[ListNode]) -> bool:
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
    prev = None
    while slow:
        nxt = slow.next
        slow.next = prev
        prev = slow
        slow = nxt
    left, right = head, prev
    while right:
        if left.val != right.val:
            return False
        left = left.next
        right = right.next
    return True`,
  'lc-040': `def inorderTraversal(root: Optional[TreeNode]) -> List[int]:
    res = []
    stack = []
    cur = root
    while cur or stack:
        while cur:
            stack.append(cur)
            cur = cur.left
        cur = stack.pop()
        res.append(cur.val)
        cur = cur.right
    return res`,
  'lc-041': `def maxDepth(root: Optional[TreeNode]) -> int:
    if not root:
        return 0
    return 1 + max(maxDepth(root.left), maxDepth(root.right))`,
  'lc-042': `def invertTree(root: Optional[TreeNode]) -> Optional[TreeNode]:
    if not root:
        return None
    root.left, root.right = root.right, root.left
    invertTree(root.left)
    invertTree(root.right)
    return root`,
  'lc-043': `from collections import deque

def levelOrder(root: Optional[TreeNode]) -> List[List[int]]:
    if not root:
        return []
    res = []
    q = deque([root])
    while q:
        level = []
        for _ in range(len(q)):
            node = q.popleft()
            level.append(node.val)
            if node.left:
                q.append(node.left)
            if node.right:
                q.append(node.right)
        res.append(level)
    return res`,
  'lc-044': `def buildTree(preorder: List[int], inorder: List[int]) -> Optional[TreeNode]:
    in_map = {v: i for i, v in enumerate(inorder)}

    def build(pre_start, pre_end, in_start, in_end):
        if pre_start > pre_end:
            return None
        root_val = preorder[pre_start]
        root = TreeNode(root_val)
        in_root = in_map[root_val]
        left_size = in_root - in_start
        root.left = build(pre_start + 1, pre_start + left_size, in_start, in_root - 1)
        root.right = build(pre_start + left_size + 1, pre_end, in_root + 1, in_end)
        return root

    return build(0, len(preorder) - 1, 0, len(inorder) - 1)`,
  'lc-045': `def isValidBST(root: Optional[TreeNode]) -> bool:
    def validate(node, low, high):
        if not node:
            return True
        if node.val <= low or node.val >= high:
            return False
        return validate(node.left, low, node.val) and validate(node.right, node.val, high)

    return validate(root, float('-inf'), float('inf'))`,
  'lc-046': `def isSymmetric(root: Optional[TreeNode]) -> bool:
    def isMirror(t1, t2):
        if not t1 and not t2:
            return True
        if not t1 or not t2:
            return False
        return (t1.val == t2.val and
                isMirror(t1.left, t2.right) and
                isMirror(t1.right, t2.left))

    return isMirror(root, root)`,
  'lc-047': `def diameterOfBinaryTree(root: Optional[TreeNode]) -> int:
    ans = 0

    def depth(node):
        nonlocal ans
        if not node:
            return 0
        left = depth(node.left)
        right = depth(node.right)
        ans = max(ans, left + right)
        return 1 + max(left, right)

    depth(root)
    return ans`,
  'lc-048': `def flatten(root: Optional[TreeNode]) -> None:
    cur = root
    while cur:
        if cur.left:
            pre = cur.left
            while pre.right:
                pre = pre.right
            pre.right = cur.right
            cur.right = cur.left
            cur.left = None
        cur = cur.right`,
  'lc-049': `def lowestCommonAncestor(root: TreeNode, p: TreeNode, q: TreeNode) -> TreeNode:
    if not root or root == p or root == q:
        return root
    left = lowestCommonAncestor(root.left, p, q)
    right = lowestCommonAncestor(root.right, p, q)
    if left and right:
        return root
    return left if left else right`,
  'lc-050': `def maxPathSum(root: Optional[TreeNode]) -> int:
    ans = float('-inf')

    def maxGain(node):
        nonlocal ans
        if not node:
            return 0
        left = max(maxGain(node.left), 0)
        right = max(maxGain(node.right), 0)
        ans = max(ans, node.val + left + right)
        return node.val + max(left, right)

    maxGain(root)
    return ans`,
  'lc-051': `def pathSum(root: Optional[TreeNode], targetSum: int) -> int:
    from collections import defaultdict
    prefix = defaultdict(int)
    prefix[0] = 1
    ans = 0

    def dfs(node, cur_sum):
        nonlocal ans
        if not node:
            return
        cur_sum += node.val
        ans += prefix[cur_sum - targetSum]
        prefix[cur_sum] += 1
        dfs(node.left, cur_sum)
        dfs(node.right, cur_sum)
        prefix[cur_sum] -= 1

    dfs(root, 0)
    return ans`,
  'lc-052': `def numIslands(grid: List[List[str]]) -> int:
    m, n = len(grid), len(grid[0])

    def dfs(i, j):
        if i < 0 or i >= m or j < 0 or j >= n or grid[i][j] == '0':
            return
        grid[i][j] = '0'
        dfs(i + 1, j)
        dfs(i - 1, j)
        dfs(i, j + 1)
        dfs(i, j - 1)

    count = 0
    for i in range(m):
        for j in range(n):
            if grid[i][j] == '1':
                count += 1
                dfs(i, j)
    return count`,
  'lc-053': `from collections import deque, defaultdict

def canFinish(numCourses: int, prerequisites: List[List[int]]) -> bool:
    graph = defaultdict(list)
    indegree = [0] * numCourses
    for a, b in prerequisites:
        graph[b].append(a)
        indegree[a] += 1
    q = deque([i for i in range(numCourses) if indegree[i] == 0])
    count = 0
    while q:
        course = q.popleft()
        count += 1
        for nxt in graph[course]:
            indegree[nxt] -= 1
            if indegree[nxt] == 0:
                q.append(nxt)
    return count == numCourses`,
  'lc-054': `from collections import deque

def orangesRotting(grid: List[List[int]]) -> int:
    m, n = len(grid), len(grid[0])
    q = deque()
    fresh = 0
    for i in range(m):
        for j in range(n):
            if grid[i][j] == 2:
                q.append((i, j))
            elif grid[i][j] == 1:
                fresh += 1
    if fresh == 0:
        return 0
    minutes = 0
    dirs = [(1, 0), (-1, 0), (0, 1), (0, -1)]
    while q:
        for _ in range(len(q)):
            i, j = q.popleft()
            for di, dj in dirs:
                ni, nj = i + di, j + dj
                if 0 <= ni < m and 0 <= nj < n and grid[ni][nj] == 1:
                    grid[ni][nj] = 2
                    fresh -= 1
                    q.append((ni, nj))
        if q:
            minutes += 1
    return minutes if fresh == 0 else -1`,
  'lc-055': `class TrieNode:
    def __init__(self):
        self.children = {}
        self.is_end = False

class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word: str) -> None:
        node = self.root
        for ch in word:
            if ch not in node.children:
                node.children[ch] = TrieNode()
            node = node.children[ch]
        node.is_end = True

    def search(self, word: str) -> bool:
        node = self.root
        for ch in word:
            if ch not in node.children:
                return False
            node = node.children[ch]
        return node.is_end

    def startsWith(self, prefix: str) -> bool:
        node = self.root
        for ch in prefix:
            if ch not in node.children:
                return False
            node = node.children[ch]
        return True`,
  'lc-056': `def permute(nums: List[int]) -> List[List[int]]:
    res = []
    used = [False] * len(nums)

    def backtrack(path):
        if len(path) == len(nums):
            res.append(path[:])
            return
        for i in range(len(nums)):
            if not used[i]:
                used[i] = True
                path.append(nums[i])
                backtrack(path)
                path.pop()
                used[i] = False

    backtrack([])
    return res`,
  'lc-057': `def subsets(nums: List[int]) -> List[List[int]]:
    res = []

    def backtrack(start, path):
        res.append(path[:])
        for i in range(start, len(nums)):
            path.append(nums[i])
            backtrack(i + 1, path)
            path.pop()

    backtrack(0, [])
    return res`,
  'lc-058': `def exist(board: List[List[str]], word: str) -> bool:
    m, n = len(board), len(board[0])

    def dfs(i, j, idx):
        if idx == len(word):
            return True
        if i < 0 or i >= m or j < 0 or j >= n or board[i][j] != word[idx]:
            return False
        temp = board[i][j]
        board[i][j] = '#'
        found = (dfs(i + 1, j, idx + 1) or
                 dfs(i - 1, j, idx + 1) or
                 dfs(i, j + 1, idx + 1) or
                 dfs(i, j - 1, idx + 1))
        board[i][j] = temp
        return found

    for i in range(m):
        for j in range(n):
            if dfs(i, j, 0):
                return True
    return False`,
  'lc-059': `def solveNQueens(n: int) -> List[List[str]]:
    res = []
    board = [['.'] * n for _ in range(n)]
    cols = set()
    diag1 = set()
    diag2 = set()

    def backtrack(row):
        if row == n:
            res.append([''.join(r) for r in board])
            return
        for col in range(n):
            if col in cols or (row - col) in diag1 or (row + col) in diag2:
                continue
            board[row][col] = 'Q'
            cols.add(col)
            diag1.add(row - col)
            diag2.add(row + col)
            backtrack(row + 1)
            board[row][col] = '.'
            cols.remove(col)
            diag1.remove(row - col)
            diag2.remove(row + col)

    backtrack(0)
    return res`,
  'lc-060': `def generateParenthesis(n: int) -> List[str]:
    res = []

    def backtrack(s, left, right):
        if left == 0 and right == 0:
            res.append(s)
            return
        if left > 0:
            backtrack(s + '(', left - 1, right)
        if right > left:
            backtrack(s + ')', left, right - 1)

    backtrack('', n, n)
    return res`,
  'lc-061': `def combinationSum(candidates: List[int], target: int) -> List[List[int]]:
    res = []

    def backtrack(start, path, remain):
        if remain == 0:
            res.append(path[:])
            return
        if remain < 0:
            return
        for i in range(start, len(candidates)):
            path.append(candidates[i])
            backtrack(i, path, remain - candidates[i])
            path.pop()

    backtrack(0, [], target)
    return res`,
  'lc-062': `def climbStairs(n: int) -> int:
    if n <= 2:
        return n
    a, b = 1, 2
    for _ in range(3, n + 1):
        a, b = b, a + b
    return b`,
  'lc-063': `def maxSubArray(nums: List[int]) -> int:
    cur_max = nums[0]
    global_max = nums[0]
    for i in range(1, len(nums)):
        cur_max = max(nums[i], cur_max + nums[i])
        global_max = max(global_max, cur_max)
    return global_max`,
  'lc-064': `from bisect import bisect_left

def lengthOfLIS(nums: List[int]) -> int:
    tails = []
    for x in nums:
        idx = bisect_left(tails, x)
        if idx == len(tails):
            tails.append(x)
        else:
            tails[idx] = x
    return len(tails)`,
  'lc-065': `def coinChange(coins: List[int], amount: int) -> int:
    dp = [amount + 1] * (amount + 1)
    dp[0] = 0
    for i in range(1, amount + 1):
        for coin in coins:
            if i >= coin:
                dp[i] = min(dp[i], dp[i - coin] + 1)
    return dp[amount] if dp[amount] != amount + 1 else -1`,
  'lc-066': `def longestCommonSubsequence(text1: str, text2: str) -> int:
    m, n = len(text1), len(text2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if text1[i - 1] == text2[j - 1]:
                dp[i][j] = dp[i - 1][j - 1] + 1
            else:
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])
    return dp[m][n]`,
  'lc-067': `def rob(nums: List[int]) -> int:
    if not nums:
        return 0
    if len(nums) == 1:
        return nums[0]
    prev2 = nums[0]
    prev1 = max(nums[0], nums[1])
    for i in range(2, len(nums)):
        cur = max(prev1, prev2 + nums[i])
        prev2 = prev1
        prev1 = cur
    return prev1`,
  'lc-068': `import math

def numSquares(n: int) -> int:
    dp = [float('inf')] * (n + 1)
    dp[0] = 0
    for i in range(1, n + 1):
        j = 1
        while j * j <= i:
            dp[i] = min(dp[i], dp[i - j * j] + 1)
            j += 1
    return dp[n]`,
  'lc-069': `def uniquePaths(m: int, n: int) -> int:
    dp = [1] * n
    for i in range(1, m):
        for j in range(1, n):
            dp[j] += dp[j - 1]
    return dp[-1]`,
  'lc-070': `def minPathSum(grid: List[List[int]]) -> int:
    m, n = len(grid), len(grid[0])
    for i in range(m):
        for j in range(n):
            if i == 0 and j == 0:
                continue
            elif i == 0:
                grid[i][j] += grid[i][j - 1]
            elif j == 0:
                grid[i][j] += grid[i - 1][j]
            else:
                grid[i][j] += min(grid[i - 1][j], grid[i][j - 1])
    return grid[-1][-1]`,
  'lc-071': `def minDistance(word1: str, word2: str) -> int:
    m, n = len(word1), len(word2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(m + 1):
        dp[i][0] = i
    for j in range(n + 1):
        dp[0][j] = j
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if word1[i - 1] == word2[j - 1]:
                dp[i][j] = dp[i - 1][j - 1]
            else:
                dp[i][j] = 1 + min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    return dp[m][n]`,
  'lc-072': `def wordBreak(s: str, wordDict: List[str]) -> bool:
    word_set = set(wordDict)
    n = len(s)
    dp = [False] * (n + 1)
    dp[0] = True
    for i in range(1, n + 1):
        for j in range(i):
            if dp[j] and s[j:i] in word_set:
                dp[i] = True
                break
    return dp[n]`,
  'lc-073': `def maxProduct(nums: List[int]) -> int:
    cur_max = cur_min = ans = nums[0]
    for i in range(1, len(nums)):
        candidates = (nums[i], nums[i] * cur_max, nums[i] * cur_min)
        cur_max = max(candidates)
        cur_min = min(candidates)
        ans = max(ans, cur_max)
    return ans`,
  'lc-074': `def canPartition(nums: List[int]) -> bool:
    total = sum(nums)
    if total % 2 != 0:
        return False
    target = total // 2
    dp = [False] * (target + 1)
    dp[0] = True
    for num in nums:
        for i in range(target, num - 1, -1):
            dp[i] = dp[i] or dp[i - num]
    return dp[target]`,
  'lc-075': `def longestValidParentheses(s: str) -> int:
    stack = [-1]
    ans = 0
    for i, c in enumerate(s):
        if c == '(':
            stack.append(i)
        else:
            stack.pop()
            if not stack:
                stack.append(i)
            else:
                ans = max(ans, i - stack[-1])
    return ans`,
  'lc-076': `def maxCoins(nums: List[int]) -> int:
    points = [1] + nums + [1]
    n = len(points)
    dp = [[0] * n for _ in range(n)]
    for length in range(2, n):
        for i in range(n - length):
            j = i + length
            for k in range(i + 1, j):
                dp[i][j] = max(dp[i][j],
                    dp[i][k] + dp[k][j] + points[i] * points[k] * points[j])
    return dp[0][n - 1]`,
  'lc-077': `def isMatch(s: str, p: str) -> bool:
    m, n = len(s), len(p)
    dp = [[False] * (n + 1) for _ in range(m + 1)]
    dp[0][0] = True
    for j in range(2, n + 1):
        if p[j - 1] == '*':
            dp[0][j] = dp[0][j - 2]
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if p[j - 1] != '*':
                if p[j - 1] == '.' or s[i - 1] == p[j - 1]:
                    dp[i][j] = dp[i - 1][j - 1]
            else:
                dp[i][j] = dp[i][j - 2]
                if p[j - 2] == '.' or s[i - 1] == p[j - 2]:
                    dp[i][j] = dp[i][j] or dp[i - 1][j]
    return dp[m][n]`,
  'lc-078': `def maxProfit(prices: List[int]) -> int:
    min_price = float('inf')
    max_profit = 0
    for price in prices:
        min_price = min(min_price, price)
        max_profit = max(max_profit, price - min_price)
    return max_profit`,
  'lc-079': `def canJump(nums: List[int]) -> bool:
    max_reach = 0
    for i in range(len(nums)):
        if i > max_reach:
            return False
        max_reach = max(max_reach, i + nums[i])
        if max_reach >= len(nums) - 1:
            return True
    return True`,
  'lc-080': `def jump(nums: List[int]) -> int:
    n = len(nums)
    if n == 1:
        return 0
    jumps = 0
    cur_end = 0
    cur_farthest = 0
    for i in range(n - 1):
        cur_farthest = max(cur_farthest, i + nums[i])
        if i == cur_end:
            jumps += 1
            cur_end = cur_farthest
    return jumps`,
  'lc-081': `import heapq

def findKthLargest(nums: List[int], k: int) -> int:
    heap = []
    for num in nums:
        heapq.heappush(heap, num)
        if len(heap) > k:
            heapq.heappop(heap)
    return heap[0]`,
  'lc-082': `from collections import Counter
import heapq

def topKFrequent(nums: List[int], k: int) -> List[int]:
    freq = Counter(nums)
    heap = []
    for num, f in freq.items():
        heapq.heappush(heap, (f, num))
        if len(heap) > k:
            heapq.heappop(heap)
    return [num for f, num in heap]`,
  'lc-083': `import heapq

class MedianFinder:
    def __init__(self):
        self.small = []  # max heap (neg)
        self.large = []  # min heap

    def addNum(self, num: int) -> None:
        heapq.heappush(self.small, -num)
        heapq.heappush(self.large, -heapq.heappop(self.small))
        if len(self.large) > len(self.small):
            heapq.heappush(self.small, -heapq.heappop(self.large))

    def findMedian(self) -> float:
        if len(self.small) > len(self.large):
            return -self.small[0]
        return (-self.small[0] + self.large[0]) / 2`,
  'lc-084': `def merge(intervals: List[List[int]]) -> List[List[int]]:
    intervals.sort(key=lambda x: x[0])
    res = []
    for interval in intervals:
        if not res or res[-1][1] < interval[0]:
            res.append(interval)
        else:
            res[-1][1] = max(res[-1][1], interval[1])
    return res`,
  'lc-085': `def sortColors(nums: List[int]) -> None:
    p0, cur, p2 = 0, 0, len(nums) - 1
    while cur <= p2:
        if nums[cur] == 0:
            nums[p0], nums[cur] = nums[cur], nums[p0]
            p0 += 1
            cur += 1
        elif nums[cur] == 2:
            nums[cur], nums[p2] = nums[p2], nums[cur]
            p2 -= 1
        else:
            cur += 1`,
  'lc-086': `def sortList(head: Optional[ListNode]) -> Optional[ListNode]:
    if not head or not head.next:
        return head
    # 快慢指针找中点
    slow, fast = head, head.next
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
    mid = slow.next
    slow.next = None
    left = sortList(head)
    right = sortList(mid)
    # 合并
    dummy = ListNode()
    cur = dummy
    while left and right:
        if left.val < right.val:
            cur.next = left
            left = left.next
        else:
            cur.next = right
            right = right.next
        cur = cur.next
    cur.next = left if left else right
    return dummy.next`,
  'lc-087': `class DNode:
    def __init__(self, key=0, val=0):
        self.key = key
        self.val = val
        self.prev = None
        self.next = None

class LRUCache:
    def __init__(self, capacity: int):
        self.cap = capacity
        self.cache = {}
        self.head = DNode()
        self.tail = DNode()
        self.head.next = self.tail
        self.tail.prev = self.head

    def _remove(self, node):
        node.prev.next = node.next
        node.next.prev = node.prev

    def _add_to_head(self, node):
        node.next = self.head.next
        node.prev = self.head
        self.head.next.prev = node
        self.head.next = node

    def _move_to_head(self, node):
        self._remove(node)
        self._add_to_head(node)

    def get(self, key: int) -> int:
        if key in self.cache:
            node = self.cache[key]
            self._move_to_head(node)
            return node.val
        return -1

    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            node = self.cache[key]
            node.val = value
            self._move_to_head(node)
        else:
            node = DNode(key, value)
            self.cache[key] = node
            self._add_to_head(node)
            if len(self.cache) > self.cap:
                tail = self.tail.prev
                self._remove(tail)
                del self.cache[tail.key]`,
  'lc-088': `import random

class RandomizedSet:
    def __init__(self):
        self.nums = []
        self.pos = {}

    def insert(self, val: int) -> bool:
        if val in self.pos:
            return False
        self.pos[val] = len(self.nums)
        self.nums.append(val)
        return True

    def remove(self, val: int) -> bool:
        if val not in self.pos:
            return False
        idx = self.pos[val]
        last = self.nums[-1]
        self.nums[idx] = last
        self.pos[last] = idx
        self.nums.pop()
        del self.pos[val]
        return True

    def getRandom(self) -> int:
        return random.choice(self.nums)`,
  'lc-089': `def singleNumber(nums: List[int]) -> int:
    res = 0
    for num in nums:
        res ^= num
    return res`,
  'lc-090': `def majorityElement(nums: List[int]) -> int:
    candidate = None
    count = 0
    for num in nums:
        if count == 0:
            candidate = num
        count += 1 if num == candidate else -1
    return candidate`,
  'lc-091': `def productExceptSelf(nums: List[int]) -> List[int]:
    n = len(nums)
    ans = [1] * n
    for i in range(1, n):
        ans[i] = ans[i - 1] * nums[i - 1]
    suffix = 1
    for i in range(n - 1, -1, -1):
        ans[i] *= suffix
        suffix *= nums[i]
    return ans`,
  'lc-092': `def nextPermutation(nums: List[int]) -> None:
    n = len(nums)
    i = n - 2
    while i >= 0 and nums[i] >= nums[i + 1]:
        i -= 1
    if i >= 0:
        j = n - 1
        while nums[j] <= nums[i]:
            j -= 1
        nums[i], nums[j] = nums[j], nums[i]
    l, r = i + 1, n - 1
    while l < r:
        nums[l], nums[r] = nums[r], nums[l]
        l += 1
        r -= 1`,
  'lc-093': `def findDuplicate(nums: List[int]) -> int:
    slow = fast = nums[0]
    while True:
        slow = nums[slow]
        fast = nums[nums[fast]]
        if slow == fast:
            break
    slow = nums[0]
    while slow != fast:
        slow = nums[slow]
        fast = nums[fast]
    return slow`,
  'lc-094': `def searchMatrix(matrix: List[List[int]], target: int) -> bool:
    m, n = len(matrix), len(matrix[0])
    i, j = 0, n - 1
    while i < m and j >= 0:
        if matrix[i][j] == target:
            return True
        elif matrix[i][j] > target:
            j -= 1
        else:
            i += 1
    return False`,
  'lc-095': `def rotate(nums: List[int], k: int) -> None:
    n = len(nums)
    k %= n

    def rev(l, r):
        while l < r:
            nums[l], nums[r] = nums[r], nums[l]
            l += 1
            r -= 1

    rev(0, n - 1)
    rev(0, k - 1)
    rev(k, n - 1)`,
  'lc-096': `def sortedArrayToBST(nums: List[int]) -> Optional[TreeNode]:
    if not nums:
        return None
    mid = len(nums) // 2
    root = TreeNode(nums[mid])
    root.left = sortedArrayToBST(nums[:mid])
    root.right = sortedArrayToBST(nums[mid + 1:])
    return root`,
  'lc-097': `def generate(numRows: int) -> List[List[int]]:
    res = []
    for i in range(numRows):
        row = [1] * (i + 1)
        for j in range(1, i):
            row[j] = res[i - 1][j - 1] + res[i - 1][j]
        res.append(row)
    return res`,
  'lc-098': `def findDisappearedNumbers(nums: List[int]) -> List[int]:
    for num in nums:
        idx = abs(num) - 1
        nums[idx] = -abs(nums[idx])
    return [i + 1 for i in range(len(nums)) if nums[i] > 0]`,
  'lc-099': `def letterCombinations(digits: str) -> List[str]:
    if not digits:
        return []
    mapping = {
        '2': 'abc', '3': 'def', '4': 'ghi', '5': 'jkl',
        '6': 'mno', '7': 'pqrs', '8': 'tuv', '9': 'wxyz'
    }
    res = []

    def backtrack(idx, path):
        if idx == len(digits):
            res.append(''.join(path))
            return
        for ch in mapping[digits[idx]]:
            path.append(ch)
            backtrack(idx + 1, path)
            path.pop()

    backtrack(0, [])
    return res`,
  'lc-100': `def countBits(n: int) -> List[int]:
    dp = [0] * (n + 1)
    for i in range(1, n + 1):
        dp[i] = dp[i >> 1] + (i & 1)
    return dp`
};
