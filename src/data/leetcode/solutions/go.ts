// Auto-generated from leetcode-hot100.ts — go solutions
// DO NOT EDIT MANUALLY

export const goSolutions: Record<string, string> = {
  'lc-001': `func twoSum(nums []int, target int) []int {
    m := make(map[int]int)
    for i, num := range nums {
        diff := target - num
        if j, ok := m[diff]; ok {
            return []int{j, i}
        }
        m[num] = i
    }
    return nil
}`,
  'lc-002': `import "sort"

func groupAnagrams(strs []string) [][]string {
    m := make(map[string][]string)
    for _, s := range strs {
        b := []byte(s)
        sort.Slice(b, func(i, j int) bool { return b[i] < b[j] })
        key := string(b)
        m[key] = append(m[key], s)
    }
    res := make([][]string, 0, len(m))
    for _, v := range m {
        res = append(res, v)
    }
    return res
}`,
  'lc-003': `func longestConsecutive(nums []int) int {
    set := make(map[int]bool)
    for _, num := range nums {
        set[num] = true
    }
    longest := 0
    for num := range set {
        if !set[num-1] {
            cur := num
            streak := 1
            for set[cur+1] {
                cur++
                streak++
            }
            if streak > longest {
                longest = streak
            }
        }
    }
    return longest
}`,
  'lc-004': `func subarraySum(nums []int, k int) int {
    count := make(map[int]int)
    count[0] = 1
    preSum := 0
    ans := 0
    for _, num := range nums {
        preSum += num
        ans += count[preSum-k]
        count[preSum]++
    }
    return ans
}`,
  'lc-005': `func moveZeroes(nums []int) {
    slow := 0
    for fast := 0; fast < len(nums); fast++ {
        if nums[fast] != 0 {
            nums[slow], nums[fast] = nums[fast], nums[slow]
            slow++
        }
    }
}`,
  'lc-006': `func maxArea(height []int) int {
    l, r := 0, len(height)-1
    ans := 0
    for l < r {
        h := height[l]
        if height[r] < h {
            h = height[r]
        }
        area := h * (r - l)
        if area > ans {
            ans = area
        }
        if height[l] < height[r] {
            l++
        } else {
            r--
        }
    }
    return ans
}`,
  'lc-007': `import "sort"

func threeSum(nums []int) [][]int {
    sort.Ints(nums)
    n := len(nums)
    var res [][]int
    for i := 0; i < n-2; i++ {
        if i > 0 && nums[i] == nums[i-1] {
            continue
        }
        l, r := i+1, n-1
        for l < r {
            sum := nums[i] + nums[l] + nums[r]
            if sum < 0 {
                l++
            } else if sum > 0 {
                r--
            } else {
                res = append(res, []int{nums[i], nums[l], nums[r]})
                for l < r && nums[l] == nums[l+1] { l++ }
                for l < r && nums[r] == nums[r-1] { r-- }
                l++
                r--
            }
        }
    }
    return res
}`,
  'lc-008': `func trap(height []int) int {
    l, r := 0, len(height)-1
    leftMax, rightMax := 0, 0
    ans := 0
    for l < r {
        if height[l] > leftMax {
            leftMax = height[l]
        }
        if height[r] > rightMax {
            rightMax = height[r]
        }
        if height[l] < height[r] {
            ans += leftMax - height[l]
            l++
        } else {
            ans += rightMax - height[r]
            r--
        }
    }
    return ans
}`,
  'lc-009': `func firstMissingPositive(nums []int) int {
    n := len(nums)
    for i := 0; i < n; i++ {
        for nums[i] >= 1 && nums[i] <= n && nums[nums[i]-1] != nums[i] {
            nums[nums[i]-1], nums[i] = nums[i], nums[nums[i]-1]
        }
    }
    for i := 0; i < n; i++ {
        if nums[i] != i+1 {
            return i + 1
        }
    }
    return n + 1
}`,
  'lc-010': `func setZeroes(matrix [][]int) {
    m, n := len(matrix), len(matrix[0])
    row0, col0 := false, false
    for j := 0; j < n; j++ {
        if matrix[0][j] == 0 {
            row0 = true
            break
        }
    }
    for i := 0; i < m; i++ {
        if matrix[i][0] == 0 {
            col0 = true
            break
        }
    }
    for i := 1; i < m; i++ {
        for j := 1; j < n; j++ {
            if matrix[i][j] == 0 {
                matrix[i][0] = 0
                matrix[0][j] = 0
            }
        }
    }
    for i := 1; i < m; i++ {
        if matrix[i][0] == 0 {
            for j := 0; j < n; j++ {
                matrix[i][j] = 0
            }
        }
    }
    for j := 1; j < n; j++ {
        if matrix[0][j] == 0 {
            for i := 0; i < m; i++ {
                matrix[i][j] = 0
            }
        }
    }
    if row0 {
        for j := 0; j < n; j++ {
            matrix[0][j] = 0
        }
    }
    if col0 {
        for i := 0; i < m; i++ {
            matrix[i][0] = 0
        }
    }
}`,
  'lc-011': `func spiralOrder(matrix [][]int) []int {
    var res []int
    top, bottom := 0, len(matrix)-1
    left, right := 0, len(matrix[0])-1
    for top <= bottom && left <= right {
        for j := left; j <= right; j++ {
            res = append(res, matrix[top][j])
        }
        top++
        for i := top; i <= bottom; i++ {
            res = append(res, matrix[i][right])
        }
        right--
        if top <= bottom {
            for j := right; j >= left; j-- {
                res = append(res, matrix[bottom][j])
            }
            bottom--
        }
        if left <= right {
            for i := bottom; i >= top; i-- {
                res = append(res, matrix[i][left])
            }
            left++
        }
    }
    return res
}`,
  'lc-012': `func rotate(matrix [][]int) {
    n := len(matrix)
    for i := 0; i < n; i++ {
        for j := i + 1; j < n; j++ {
            matrix[i][j], matrix[j][i] = matrix[j][i], matrix[i][j]
        }
    }
    for i := 0; i < n; i++ {
        for l, r := 0, n-1; l < r; l, r = l+1, r-1 {
            matrix[i][l], matrix[i][r] = matrix[i][r], matrix[i][l]
        }
    }
}`,
  'lc-013': `func merge(nums1 []int, m int, nums2 []int, n int) {
    p1, p2 := m-1, n-1
    p := m + n - 1
    for p2 >= 0 {
        if p1 >= 0 && nums1[p1] > nums2[p2] {
            nums1[p] = nums1[p1]
            p1--
        } else {
            nums1[p] = nums2[p2]
            p2--
        }
        p--
    }
}`,
  'lc-014': `func removeDuplicates(nums []int) int {
    if len(nums) == 0 {
        return 0
    }
    slow := 0
    for fast := 1; fast < len(nums); fast++ {
        if nums[fast] != nums[slow] {
            slow++
            nums[slow] = nums[fast]
        }
    }
    return slow + 1
}`,
  'lc-015': `func removeElement(nums []int, val int) int {
    slow := 0
    for fast := 0; fast < len(nums); fast++ {
        if nums[fast] != val {
            nums[slow] = nums[fast]
            slow++
        }
    }
    return slow
}`,
  'lc-016': `func twoSum(numbers []int, target int) []int {
    l, r := 0, len(numbers)-1
    for l < r {
        sum := numbers[l] + numbers[r]
        if sum == target {
            return []int{l + 1, r + 1}
        } else if sum < target {
            l++
        } else {
            r--
        }
    }
    return nil
}`,
  'lc-017': `func reverseString(s []byte) {
    l, r := 0, len(s)-1
    for l < r {
        s[l], s[r] = s[r], s[l]
        l++
        r--
    }
}`,
  'lc-018': `func longestPalindrome(s string) string {
    start, maxLen := 0, 0
    n := len(s)
    for i := 0; i < n; i++ {
        l, r := i, i
        for l >= 0 && r < n && s[l] == s[r] {
            if r-l+1 > maxLen {
                maxLen = r - l + 1
                start = l
            }
            l--
            r++
        }
        l, r = i, i+1
        for l >= 0 && r < n && s[l] == s[r] {
            if r-l+1 > maxLen {
                maxLen = r - l + 1
                start = l
            }
            l--
            r++
        }
    }
    return s[start : start+maxLen]
}`,
  'lc-019': `func lengthOfLongestSubstring(s string) int {
    seen := make(map[byte]bool)
    l, ans := 0, 0
    for r := 0; r < len(s); r++ {
        for seen[s[r]] {
            delete(seen, s[l])
            l++
        }
        seen[s[r]] = true
        if r-l+1 > ans {
            ans = r - l + 1
        }
    }
    return ans
}`,
  'lc-020': `func findAnagrams(s string, p string) []int {
    need := make(map[byte]int)
    window := make(map[byte]int)
    for i := 0; i < len(p); i++ {
        need[p[i]]++
    }
    l, valid := 0, 0
    var res []int
    for r := 0; r < len(s); r++ {
        c := s[r]
        if _, ok := need[c]; ok {
            window[c]++
            if window[c] == need[c] {
                valid++
            }
        }
        if r-l+1 == len(p) {
            if valid == len(need) {
                res = append(res, l)
            }
            d := s[l]
            if _, ok := need[d]; ok {
                if window[d] == need[d] {
                    valid--
                }
                window[d]--
            }
            l++
        }
    }
    return res
}`,
  'lc-021': `import "math"

func minWindow(s string, t string) string {
    need := make(map[byte]int)
    window := make(map[byte]int)
    for i := 0; i < len(t); i++ {
        need[t[i]]++
    }
    l, valid := 0, 0
    start, minLen := 0, math.MaxInt32
    for r := 0; r < len(s); r++ {
        c := s[r]
        if _, ok := need[c]; ok {
            window[c]++
            if window[c] == need[c] {
                valid++
            }
        }
        for valid == len(need) {
            if r-l+1 < minLen {
                minLen = r - l + 1
                start = l
            }
            d := s[l]
            if _, ok := need[d]; ok {
                if window[d] == need[d] {
                    valid--
                }
                window[d]--
            }
            l++
        }
    }
    if minLen == math.MaxInt32 {
        return ""
    }
    return s[start : start+minLen]
}`,
  'lc-022': `func maxSlidingWindow(nums []int, k int) []int {
    q := make([]int, 0)
    var res []int
    for r := 0; r < len(nums); r++ {
        if len(q) > 0 && q[0] < r-k+1 {
            q = q[1:]
        }
        for len(q) > 0 && nums[q[len(q)-1]] < nums[r] {
            q = q[:len(q)-1]
        }
        q = append(q, r)
        if r >= k-1 {
            res = append(res, nums[q[0]])
        }
    }
    return res
}`,
  'lc-023': `func checkInclusion(s1 string, s2 string) bool {
    need := make(map[byte]int)
    window := make(map[byte]int)
    for i := 0; i < len(s1); i++ {
        need[s1[i]]++
    }
    l, valid := 0, 0
    for r := 0; r < len(s2); r++ {
        c := s2[r]
        if _, ok := need[c]; ok {
            window[c]++
            if window[c] == need[c] {
                valid++
            }
        }
        if r-l+1 == len(s1) {
            if valid == len(need) {
                return true
            }
            d := s2[l]
            if _, ok := need[d]; ok {
                if window[d] == need[d] {
                    valid--
                }
                window[d]--
            }
            l++
        }
    }
    return false
}`,
  'lc-024': `func search(nums []int, target int) int {
    l, r := 0, len(nums)-1
    for l <= r {
        mid := l + (r-l)/2
        if nums[mid] == target {
            return mid
        }
        if nums[l] <= nums[mid] {
            if nums[l] <= target && target < nums[mid] {
                r = mid - 1
            } else {
                l = mid + 1
            }
        } else {
            if nums[mid] < target && target <= nums[r] {
                l = mid + 1
            } else {
                r = mid - 1
            }
        }
    }
    return -1
}`,
  'lc-025': `func searchRange(nums []int, target int) []int {
    leftBound := func() int {
        l, r := 0, len(nums)-1
        for l <= r {
            mid := l + (r-l)/2
            if nums[mid] < target {
                l = mid + 1
            } else {
                r = mid - 1
            }
        }
        if l < len(nums) && nums[l] == target {
            return l
        }
        return -1
    }

    rightBound := func() int {
        l, r := 0, len(nums)-1
        for l <= r {
            mid := l + (r-l)/2
            if nums[mid] <= target {
                l = mid + 1
            } else {
                r = mid - 1
            }
        }
        if r >= 0 && nums[r] == target {
            return r
        }
        return -1
    }

    return []int{leftBound(), rightBound()}
}`,
  'lc-026': `func searchMatrix(matrix [][]int, target int) bool {
    m, n := len(matrix), len(matrix[0])
    l, r := 0, m*n-1
    for l <= r {
        mid := (l + r) / 2
        val := matrix[mid/n][mid%n]
        if val == target {
            return true
        } else if val < target {
            l = mid + 1
        } else {
            r = mid - 1
        }
    }
    return false
}`,
  'lc-027': `func findMin(nums []int) int {
    l, r := 0, len(nums)-1
    for l < r {
        mid := (l + r) / 2
        if nums[mid] < nums[r] {
            r = mid
        } else {
            l = mid + 1
        }
    }
    return nums[l]
}`,
  'lc-028': `func isValid(s string) bool {
    stack := []rune{}
    for _, c := range s {
        if c == '(' || c == '{' || c == '[' {
            stack = append(stack, c)
        } else {
            if len(stack) == 0 {
                return false
            }
            top := stack[len(stack)-1]
            stack = stack[:len(stack)-1]
            if c == ')' && top != '(' { return false }
            if c == '}' && top != '{' { return false }
            if c == ']' && top != '[' { return false }
        }
    }
    return len(stack) == 0
}`,
  'lc-029': `type MinStack struct {
    stack    []int
    minStack []int
}

func Constructor() MinStack {
    return MinStack{}
}

func (this *MinStack) Push(val int) {
    this.stack = append(this.stack, val)
    if len(this.minStack) == 0 || val <= this.minStack[len(this.minStack)-1] {
        this.minStack = append(this.minStack, val)
    }
}

func (this *MinStack) Pop() {
    if this.stack[len(this.stack)-1] == this.minStack[len(this.minStack)-1] {
        this.minStack = this.minStack[:len(this.minStack)-1]
    }
    this.stack = this.stack[:len(this.stack)-1]
}

func (this *MinStack) Top() int {
    return this.stack[len(this.stack)-1]
}

func (this *MinStack) GetMin() int {
    return this.minStack[len(this.minStack)-1]
}`,
  'lc-030': `func dailyTemperatures(temperatures []int) []int {
    n := len(temperatures)
    ans := make([]int, n)
    stack := []int{}
    for i, temp := range temperatures {
        for len(stack) > 0 && temp > temperatures[stack[len(stack)-1]] {
            prev := stack[len(stack)-1]
            stack = stack[:len(stack)-1]
            ans[prev] = i - prev
        }
        stack = append(stack, i)
    }
    return ans
}`,
  'lc-031': `func decodeString(s string) string {
    numStack := []int{}
    strStack := []string{}
    cur := ""
    num := 0
    for _, c := range s {
        if c >= '0' && c <= '9' {
            num = num*10 + int(c-'0')
        } else if c == '[' {
            numStack = append(numStack, num)
            strStack = append(strStack, cur)
            num = 0
            cur = ""
        } else if c == ']' {
            repeat := numStack[len(numStack)-1]
            numStack = numStack[:len(numStack)-1]
            prev := strStack[len(strStack)-1]
            strStack = strStack[:len(strStack)-1]
            for i := 0; i < repeat; i++ {
                prev += cur
            }
            cur = prev
        } else {
            cur += string(c)
        }
    }
    return cur
}`,
  'lc-032': `type ListNode struct {
    Val  int
    Next *ListNode
}

func hasCycle(head *ListNode) bool {
    slow, fast := head, head
    for fast != nil && fast.Next != nil {
        slow = slow.Next
        fast = fast.Next.Next
        if slow == fast {
            return true
        }
    }
    return false
}`,
  'lc-033': `type ListNode struct {
    Val  int
    Next *ListNode
}

func reverseList(head *ListNode) *ListNode {
    var prev *ListNode
    curr := head
    for curr != nil {
        next := curr.Next
        curr.Next = prev
        prev = curr
        curr = next
    }
    return prev
}`,
  'lc-034': `type ListNode struct {
    Val  int
    Next *ListNode
}

func getIntersectionNode(headA, headB *ListNode) *ListNode {
    pA, pB := headA, headB
    for pA != pB {
        if pA != nil {
            pA = pA.Next
        } else {
            pA = headB
        }
        if pB != nil {
            pB = pB.Next
        } else {
            pB = headA
        }
    }
    return pA
}`,
  'lc-035': `import "container/heap"

type ListNode struct {
    Val  int
    Next *ListNode
}

type MinHeap []*ListNode

func (h MinHeap) Len() int            { return len(h) }
func (h MinHeap) Less(i, j int) bool  { return h[i].Val < h[j].Val }
func (h MinHeap) Swap(i, j int)       { h[i], h[j] = h[j], h[i] }
func (h *MinHeap) Push(x any)         { *h = append(*h, x.(*ListNode)) }
func (h *MinHeap) Pop() any {
    old := *h
    n := len(old)
    x := old[n-1]
    *h = old[:n-1]
    return x
}

func mergeKLists(lists []*ListNode) *ListNode {
    h := &MinHeap{}
    heap.Init(h)
    for _, node := range lists {
        if node != nil {
            heap.Push(h, node)
        }
    }
    dummy := &ListNode{}
    cur := dummy
    for h.Len() > 0 {
        node := heap.Pop(h).(*ListNode)
        cur.Next = node
        cur = cur.Next
        if node.Next != nil {
            heap.Push(h, node.Next)
        }
    }
    return dummy.Next
}`,
  'lc-036': `type ListNode struct {
    Val  int
    Next *ListNode
}

func addTwoNumbers(l1 *ListNode, l2 *ListNode) *ListNode {
    dummy := &ListNode{}
    cur := dummy
    carry := 0
    for l1 != nil || l2 != nil || carry != 0 {
        val1, val2 := 0, 0
        if l1 != nil {
            val1 = l1.Val
            l1 = l1.Next
        }
        if l2 != nil {
            val2 = l2.Val
            l2 = l2.Next
        }
        total := val1 + val2 + carry
        carry = total / 10
        cur.Next = &ListNode{Val: total % 10}
        cur = cur.Next
    }
    return dummy.Next
}`,
  'lc-037': `type ListNode struct {
    Val  int
    Next *ListNode
}

func removeNthFromEnd(head *ListNode, n int) *ListNode {
    dummy := &ListNode{0, head}
    slow, fast := dummy, dummy
    for i := 0; i < n; i++ {
        fast = fast.Next
    }
    for fast.Next != nil {
        slow = slow.Next
        fast = fast.Next
    }
    slow.Next = slow.Next.Next
    return dummy.Next
}`,
  'lc-038': `type ListNode struct {
    Val  int
    Next *ListNode
}

func mergeTwoLists(list1 *ListNode, list2 *ListNode) *ListNode {
    dummy := &ListNode{}
    cur := dummy
    for list1 != nil && list2 != nil {
        if list1.Val < list2.Val {
            cur.Next = list1
            list1 = list1.Next
        } else {
            cur.Next = list2
            list2 = list2.Next
        }
        cur = cur.Next
    }
    if list1 != nil {
        cur.Next = list1
    } else {
        cur.Next = list2
    }
    return dummy.Next
}`,
  'lc-039': `type ListNode struct {
    Val  int
    Next *ListNode
}

func isPalindrome(head *ListNode) bool {
    slow, fast := head, head
    for fast != nil && fast.Next != nil {
        slow = slow.Next
        fast = fast.Next.Next
    }
    var prev *ListNode
    for slow != nil {
        next := slow.Next
        slow.Next = prev
        prev = slow
        slow = next
    }
    left, right := head, prev
    for right != nil {
        if left.Val != right.Val {
            return false
        }
        left = left.Next
        right = right.Next
    }
    return true
}`,
  'lc-040': `type TreeNode struct {
    Val   int
    Left  *TreeNode
    Right *TreeNode
}

func inorderTraversal(root *TreeNode) []int {
    res := []int{}
    stack := []*TreeNode{}
    cur := root
    for cur != nil || len(stack) > 0 {
        for cur != nil {
            stack = append(stack, cur)
            cur = cur.Left
        }
        cur = stack[len(stack)-1]
        stack = stack[:len(stack)-1]
        res = append(res, cur.Val)
        cur = cur.Right
    }
    return res
}`,
  'lc-041': `type TreeNode struct {
    Val   int
    Left  *TreeNode
    Right *TreeNode
}

func maxDepth(root *TreeNode) int {
    if root == nil {
        return 0
    }
    left := maxDepth(root.Left)
    right := maxDepth(root.Right)
    if left > right {
        return 1 + left
    }
    return 1 + right
}`,
  'lc-042': `type TreeNode struct {
    Val   int
    Left  *TreeNode
    Right *TreeNode
}

func invertTree(root *TreeNode) *TreeNode {
    if root == nil {
        return nil
    }
    root.Left, root.Right = root.Right, root.Left
    invertTree(root.Left)
    invertTree(root.Right)
    return root
}`,
  'lc-043': `type TreeNode struct {
    Val   int
    Left  *TreeNode
    Right *TreeNode
}

func levelOrder(root *TreeNode) [][]int {
    if root == nil {
        return nil
    }
    res := [][]int{}
    q := []*TreeNode{root}
    for len(q) > 0 {
        size := len(q)
        level := []int{}
        for i := 0; i < size; i++ {
            node := q[0]
            q = q[1:]
            level = append(level, node.Val)
            if node.Left != nil {
                q = append(q, node.Left)
            }
            if node.Right != nil {
                q = append(q, node.Right)
            }
        }
        res = append(res, level)
    }
    return res
}`,
  'lc-044': `type TreeNode struct {
    Val   int
    Left  *TreeNode
    Right *TreeNode
}

func buildTree(preorder []int, inorder []int) *TreeNode {
    inMap := make(map[int]int)
    for i, v := range inorder {
        inMap[v] = i
    }

    var build func(int, int, int, int) *TreeNode
    build = func(preStart, preEnd, inStart, inEnd int) *TreeNode {
        if preStart > preEnd {
            return nil
        }
        rootVal := preorder[preStart]
        root := &TreeNode{Val: rootVal}
        inRoot := inMap[rootVal]
        leftSize := inRoot - inStart
        root.Left = build(preStart+1, preStart+leftSize, inStart, inRoot-1)
        root.Right = build(preStart+leftSize+1, preEnd, inRoot+1, inEnd)
        return root
    }

    return build(0, len(preorder)-1, 0, len(inorder)-1)
}`,
  'lc-045': `import "math"

type TreeNode struct {
    Val   int
    Left  *TreeNode
    Right *TreeNode
}

func isValidBST(root *TreeNode) bool {
    var validate func(*TreeNode, int, int) bool
    validate = func(node *TreeNode, low, high int) bool {
        if node == nil {
            return true
        }
        if node.Val <= low || node.Val >= high {
            return false
        }
        return validate(node.Left, low, node.Val) && validate(node.Right, node.Val, high)
    }
    return validate(root, math.MinInt64, math.MaxInt64)
}`,
  'lc-046': `type TreeNode struct {
    Val   int
    Left  *TreeNode
    Right *TreeNode
}

func isSymmetric(root *TreeNode) bool {
    var isMirror func(*TreeNode, *TreeNode) bool
    isMirror = func(t1, t2 *TreeNode) bool {
        if t1 == nil && t2 == nil {
            return true
        }
        if t1 == nil || t2 == nil {
            return false
        }
        return t1.Val == t2.Val &&
            isMirror(t1.Left, t2.Right) &&
            isMirror(t1.Right, t2.Left)
    }
    return isMirror(root, root)
}`,
  'lc-047': `type TreeNode struct {
    Val   int
    Left  *TreeNode
    Right *TreeNode
}

func diameterOfBinaryTree(root *TreeNode) int {
    ans := 0

    var depth func(*TreeNode) int
    depth = func(node *TreeNode) int {
        if node == nil {
            return 0
        }
        left := depth(node.Left)
        right := depth(node.Right)
        if left+right > ans {
            ans = left + right
        }
        if left > right {
            return 1 + left
        }
        return 1 + right
    }

    depth(root)
    return ans
}`,
  'lc-048': `type TreeNode struct {
    Val   int
    Left  *TreeNode
    Right *TreeNode
}

func flatten(root *TreeNode) {
    cur := root
    for cur != nil {
        if cur.Left != nil {
            pre := cur.Left
            for pre.Right != nil {
                pre = pre.Right
            }
            pre.Right = cur.Right
            cur.Right = cur.Left
            cur.Left = nil
        }
        cur = cur.Right
    }
}`,
  'lc-049': `type TreeNode struct {
    Val   int
    Left  *TreeNode
    Right *TreeNode
}

func lowestCommonAncestor(root, p, q *TreeNode) *TreeNode {
    if root == nil || root == p || root == q {
        return root
    }
    left := lowestCommonAncestor(root.Left, p, q)
    right := lowestCommonAncestor(root.Right, p, q)
    if left != nil && right != nil {
        return root
    }
    if left != nil {
        return left
    }
    return right
}`,
  'lc-050': `import "math"

type TreeNode struct {
    Val   int
    Left  *TreeNode
    Right *TreeNode
}

func maxPathSum(root *TreeNode) int {
    ans := math.MinInt32

    var maxGain func(*TreeNode) int
    maxGain = func(node *TreeNode) int {
        if node == nil {
            return 0
        }
        left := max(maxGain(node.Left), 0)
        right := max(maxGain(node.Right), 0)
        if node.Val+left+right > ans {
            ans = node.Val + left + right
        }
        if left > right {
            return node.Val + left
        }
        return node.Val + right
    }

    maxGain(root)
    return ans
}

func max(a, b int) int {
    if a > b {
        return a
    }
    return b
}`,
  'lc-051': `func pathSum(root *TreeNode, targetSum int) int {
    prefix := map[int]int{0: 1}

    var dfs func(*TreeNode, int) int
    dfs = func(node *TreeNode, curSum int) int {
        if node == nil {
            return 0
        }
        curSum += node.Val
        ans := prefix[curSum-targetSum]
        prefix[curSum]++
        ans += dfs(node.Left, curSum)
        ans += dfs(node.Right, curSum)
        prefix[curSum]--
        return ans
    }

    return dfs(root, 0)
}`,
  'lc-052': `func numIslands(grid [][]byte) int {
    m, n := len(grid), len(grid[0])
    count := 0

    var dfs func(int, int)
    dfs = func(i, j int) {
        if i < 0 || i >= m || j < 0 || j >= n || grid[i][j] == '0' {
            return
        }
        grid[i][j] = '0'
        dfs(i+1, j)
        dfs(i-1, j)
        dfs(i, j+1)
        dfs(i, j-1)
    }

    for i := 0; i < m; i++ {
        for j := 0; j < n; j++ {
            if grid[i][j] == '1' {
                count++
                dfs(i, j)
            }
        }
    }
    return count
}`,
  'lc-053': `func canFinish(numCourses int, prerequisites [][]int) bool {
    graph := make([][]int, numCourses)
    indegree := make([]int, numCourses)
    for _, pre := range prerequisites {
        graph[pre[1]] = append(graph[pre[1]], pre[0])
        indegree[pre[0]]++
    }
    q := make([]int, 0)
    for i := 0; i < numCourses; i++ {
        if indegree[i] == 0 {
            q = append(q, i)
        }
    }
    count := 0
    for len(q) > 0 {
        course := q[0]
        q = q[1:]
        count++
        for _, nxt := range graph[course] {
            indegree[nxt]--
            if indegree[nxt] == 0 {
                q = append(q, nxt)
            }
        }
    }
    return count == numCourses
}`,
  'lc-054': `func orangesRotting(grid [][]int) int {
    m, n := len(grid), len(grid[0])
    type pair struct{ i, j int }
    q := make([]pair, 0)
    fresh := 0
    for i := 0; i < m; i++ {
        for j := 0; j < n; j++ {
            if grid[i][j] == 2 {
                q = append(q, pair{i, j})
            } else if grid[i][j] == 1 {
                fresh++
            }
        }
    }
    if fresh == 0 {
        return 0
    }
    minutes := 0
    dirs := [][2]int{{1, 0}, {-1, 0}, {0, 1}, {0, -1}}
    for len(q) > 0 && fresh > 0 {
        size := len(q)
        for k := 0; k < size; k++ {
            cell := q[0]
            q = q[1:]
            for _, d := range dirs {
                ni, nj := cell.i+d[0], cell.j+d[1]
                if ni >= 0 && ni < m && nj >= 0 && nj < n && grid[ni][nj] == 1 {
                    grid[ni][nj] = 2
                    fresh--
                    q = append(q, pair{ni, nj})
                }
            }
        }
        minutes++
    }
    if fresh == 0 {
        return minutes
    }
    return -1
}`,
  'lc-055': `type Trie struct {
    root *TrieNode
}

type TrieNode struct {
    children map[byte]*TrieNode
    isEnd    bool
}

func Constructor() Trie {
    return Trie{root: &TrieNode{children: make(map[byte]*TrieNode)}}
}

func (t *Trie) Insert(word string) {
    node := t.root
    for i := 0; i < len(word); i++ {
        ch := word[i]
        if node.children[ch] == nil {
            node.children[ch] = &TrieNode{children: make(map[byte]*TrieNode)}
        }
        node = node.children[ch]
    }
    node.isEnd = true
}

func (t *Trie) Search(word string) bool {
    node := t.root
    for i := 0; i < len(word); i++ {
        ch := word[i]
        if node.children[ch] == nil {
            return false
        }
        node = node.children[ch]
    }
    return node.isEnd
}

func (t *Trie) StartsWith(prefix string) bool {
    node := t.root
    for i := 0; i < len(prefix); i++ {
        ch := prefix[i]
        if node.children[ch] == nil {
            return false
        }
        node = node.children[ch]
    }
    return true
}`,
  'lc-056': `func permute(nums []int) [][]int {
    var res [][]int
    used := make([]bool, len(nums))

    var backtrack func([]int)
    backtrack = func(path []int) {
        if len(path) == len(nums) {
            tmp := make([]int, len(path))
            copy(tmp, path)
            res = append(res, tmp)
            return
        }
        for i := 0; i < len(nums); i++ {
            if !used[i] {
                used[i] = true
                path = append(path, nums[i])
                backtrack(path)
                path = path[:len(path)-1]
                used[i] = false
            }
        }
    }

    backtrack([]int{})
    return res
}`,
  'lc-057': `func subsets(nums []int) [][]int {
    var res [][]int

    var backtrack func(int, []int)
    backtrack = func(start int, path []int) {
        tmp := make([]int, len(path))
        copy(tmp, path)
        res = append(res, tmp)
        for i := start; i < len(nums); i++ {
            path = append(path, nums[i])
            backtrack(i+1, path)
            path = path[:len(path)-1]
        }
    }

    backtrack(0, []int{})
    return res
}`,
  'lc-058': `func exist(board [][]byte, word string) bool {
    m, n := len(board), len(board[0])

    var dfs func(int, int, int) bool
    dfs = func(i, j, idx int) bool {
        if idx == len(word) {
            return true
        }
        if i < 0 || i >= m || j < 0 || j >= n || board[i][j] != word[idx] {
            return false
        }
        temp := board[i][j]
        board[i][j] = '#'
        found := dfs(i+1, j, idx+1) ||
                 dfs(i-1, j, idx+1) ||
                 dfs(i, j+1, idx+1) ||
                 dfs(i, j-1, idx+1)
        board[i][j] = temp
        return found
    }

    for i := 0; i < m; i++ {
        for j := 0; j < n; j++ {
            if dfs(i, j, 0) {
                return true
            }
        }
    }
    return false
}`,
  'lc-059': `func solveNQueens(n int) [][]string {
    var res [][]string
    board := make([][]byte, n)
    for i := 0; i < n; i++ {
        board[i] = make([]byte, n)
        for j := 0; j < n; j++ {
            board[i][j] = '.'
        }
    }
    cols := make(map[int]bool)
    diag1 := make(map[int]bool)
    diag2 := make(map[int]bool)

    var backtrack func(int)
    backtrack = func(row int) {
        if row == n {
            list := make([]string, n)
            for i := 0; i < n; i++ {
                list[i] = string(board[i])
            }
            res = append(res, list)
            return
        }
        for col := 0; col < n; col++ {
            if cols[col] || diag1[row-col] || diag2[row+col] {
                continue
            }
            board[row][col] = 'Q'
            cols[col] = true
            diag1[row-col] = true
            diag2[row+col] = true
            backtrack(row + 1)
            board[row][col] = '.'
            delete(cols, col)
            delete(diag1, row-col)
            delete(diag2, row+col)
        }
    }

    backtrack(0)
    return res
}`,
  'lc-060': `func generateParenthesis(n int) []string {
    var res []string

    var backtrack func(string, int, int)
    backtrack = func(s string, left, right int) {
        if left == 0 && right == 0 {
            res = append(res, s)
            return
        }
        if left > 0 {
            backtrack(s+"(", left-1, right)
        }
        if right > left {
            backtrack(s+")", left, right-1)
        }
    }

    backtrack("", n, n)
    return res
}`,
  'lc-061': `func combinationSum(candidates []int, target int) [][]int {
    var res [][]int

    var backtrack func(int, []int, int)
    backtrack = func(start int, path []int, remain int) {
        if remain == 0 {
            tmp := make([]int, len(path))
            copy(tmp, path)
            res = append(res, tmp)
            return
        }
        if remain < 0 {
            return
        }
        for i := start; i < len(candidates); i++ {
            path = append(path, candidates[i])
            backtrack(i, path, remain-candidates[i])
            path = path[:len(path)-1]
        }
    }

    backtrack(0, []int{}, target)
    return res
}`,
  'lc-062': `func climbStairs(n int) int {
    if n <= 2 {
        return n
    }
    a, b := 1, 2
    for i := 3; i <= n; i++ {
        a, b = b, a+b
    }
    return b
}`,
  'lc-063': `func maxSubArray(nums []int) int {
    curMax, globalMax := nums[0], nums[0]
    for i := 1; i < len(nums); i++ {
        if nums[i] > curMax+nums[i] {
            curMax = nums[i]
        } else {
            curMax = curMax + nums[i]
        }
        if curMax > globalMax {
            globalMax = curMax
        }
    }
    return globalMax
}`,
  'lc-064': `import "sort"

func lengthOfLIS(nums []int) int {
    tails := make([]int, 0)
    for _, x := range nums {
        idx := sort.Search(len(tails), func(i int) bool { return tails[i] >= x })
        if idx == len(tails) {
            tails = append(tails, x)
        } else {
            tails[idx] = x
        }
    }
    return len(tails)
}`,
  'lc-065': `func coinChange(coins []int, amount int) int {
    maxVal := amount + 1
    dp := make([]int, amount+1)
    for i := 1; i <= amount; i++ {
        dp[i] = maxVal
    }
    for i := 1; i <= amount; i++ {
        for _, coin := range coins {
            if i >= coin && dp[i-coin]+1 < dp[i] {
                dp[i] = dp[i-coin] + 1
            }
        }
    }
    if dp[amount] == maxVal {
        return -1
    }
    return dp[amount]
}`,
  'lc-066': `func longestCommonSubsequence(text1 string, text2 string) int {
    m, n := len(text1), len(text2)
    dp := make([][]int, m+1)
    for i := 0; i <= m; i++ {
        dp[i] = make([]int, n+1)
    }
    for i := 1; i <= m; i++ {
        for j := 1; j <= n; j++ {
            if text1[i-1] == text2[j-1] {
                dp[i][j] = dp[i-1][j-1] + 1
            } else {
                if dp[i-1][j] > dp[i][j-1] {
                    dp[i][j] = dp[i-1][j]
                } else {
                    dp[i][j] = dp[i][j-1]
                }
            }
        }
    }
    return dp[m][n]
}`,
  'lc-067': `func rob(nums []int) int {
    if len(nums) == 0 {
        return 0
    }
    if len(nums) == 1 {
        return nums[0]
    }
    prev2 := nums[0]
    prev1 := nums[0]
    if nums[1] > prev1 {
        prev1 = nums[1]
    }
    for i := 2; i < len(nums); i++ {
        cur := prev1
        if prev2+nums[i] > cur {
            cur = prev2 + nums[i]
        }
        prev2 = prev1
        prev1 = cur
    }
    return prev1
}`,
  'lc-068': `import "math"

func numSquares(n int) int {
    dp := make([]int, n+1)
    for i := 1; i <= n; i++ {
        dp[i] = math.MaxInt32
    }
    for i := 1; i <= n; i++ {
        for j := 1; j*j <= i; j++ {
            if dp[i-j*j]+1 < dp[i] {
                dp[i] = dp[i-j*j] + 1
            }
        }
    }
    return dp[n]
}`,
  'lc-069': `func uniquePaths(m int, n int) int {
    dp := make([]int, n)
    for j := 0; j < n; j++ {
        dp[j] = 1
    }
    for i := 1; i < m; i++ {
        for j := 1; j < n; j++ {
            dp[j] += dp[j-1]
        }
    }
    return dp[n-1]
}`,
  'lc-070': `func minPathSum(grid [][]int) int {
    m, n := len(grid), len(grid[0])
    for i := 0; i < m; i++ {
        for j := 0; j < n; j++ {
            if i == 0 && j == 0 {
                continue
            } else if i == 0 {
                grid[i][j] += grid[i][j-1]
            } else if j == 0 {
                grid[i][j] += grid[i-1][j]
            } else {
                if grid[i-1][j] < grid[i][j-1] {
                    grid[i][j] += grid[i-1][j]
                } else {
                    grid[i][j] += grid[i][j-1]
                }
            }
        }
    }
    return grid[m-1][n-1]
}`,
  'lc-071': `func minDistance(word1 string, word2 string) int {
    m, n := len(word1), len(word2)
    dp := make([][]int, m+1)
    for i := 0; i <= m; i++ {
        dp[i] = make([]int, n+1)
        dp[i][0] = i
    }
    for j := 0; j <= n; j++ {
        dp[0][j] = j
    }
    for i := 1; i <= m; i++ {
        for j := 1; j <= n; j++ {
            if word1[i-1] == word2[j-1] {
                dp[i][j] = dp[i-1][j-1]
            } else {
                dp[i][j] = 1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])
            }
        }
    }
    return dp[m][n]
}`,
  'lc-072': `func wordBreak(s string, wordDict []string) bool {
    wordSet := make(map[string]bool)
    for _, w := range wordDict {
        wordSet[w] = true
    }
    n := len(s)
    dp := make([]bool, n+1)
    dp[0] = true
    for i := 1; i <= n; i++ {
        for j := 0; j < i; j++ {
            if dp[j] && wordSet[s[j:i]] {
                dp[i] = true
                break
            }
        }
    }
    return dp[n]
}`,
  'lc-073': `func maxProduct(nums []int) int {
    curMax, curMin, ans := nums[0], nums[0], nums[0]
    for i := 1; i < len(nums); i++ {
        tmpMax := max(nums[i], nums[i]*curMax, nums[i]*curMin)
        curMin = min(nums[i], nums[i]*curMax, nums[i]*curMin)
        curMax = tmpMax
        if curMax > ans {
            ans = curMax
        }
    }
    return ans
}`,
  'lc-074': `func canPartition(nums []int) bool {
    total := 0
    for _, num := range nums {
        total += num
    }
    if total%2 != 0 {
        return false
    }
    target := total / 2
    dp := make([]bool, target+1)
    dp[0] = true
    for _, num := range nums {
        for i := target; i >= num; i-- {
            dp[i] = dp[i] || dp[i-num]
        }
    }
    return dp[target]
}`,
  'lc-075': `func longestValidParentheses(s string) int {
    stack := []int{-1}
    ans := 0
    for i := 0; i < len(s); i++ {
        if s[i] == '(' {
            stack = append(stack, i)
        } else {
            stack = stack[:len(stack)-1]
            if len(stack) == 0 {
                stack = append(stack, i)
            } else {
                if i-stack[len(stack)-1] > ans {
                    ans = i - stack[len(stack)-1]
                }
            }
        }
    }
    return ans
}`,
  'lc-076': `func maxCoins(nums []int) int {
    n := len(nums)
    points := make([]int, n+2)
    points[0], points[n+1] = 1, 1
    for i, v := range nums {
        points[i+1] = v
    }
    dp := make([][]int, n+2)
    for i := range dp {
        dp[i] = make([]int, n+2)
    }
    for l := 2; l < n+2; l++ {
        for i := 0; i+l < n+2; i++ {
            j := i + l
            for k := i + 1; k < j; k++ {
                dp[i][j] = max(dp[i][j],
                    dp[i][k]+dp[k][j]+points[i]*points[k]*points[j])
            }
        }
    }
    return dp[0][n+1]
}`,
  'lc-077': `func isMatch(s string, p string) bool {
    m, n := len(s), len(p)
    dp := make([][]bool, m+1)
    for i := range dp {
        dp[i] = make([]bool, n+1)
    }
    dp[0][0] = true
    for j := 2; j <= n; j++ {
        if p[j-1] == '*' {
            dp[0][j] = dp[0][j-2]
        }
    }
    for i := 1; i <= m; i++ {
        for j := 1; j <= n; j++ {
            if p[j-1] != '*' {
                if p[j-1] == '.' || s[i-1] == p[j-1] {
                    dp[i][j] = dp[i-1][j-1]
                }
            } else {
                dp[i][j] = dp[i][j-2]
                if p[j-2] == '.' || s[i-1] == p[j-2] {
                    dp[i][j] = dp[i][j] || dp[i-1][j]
                }
            }
        }
    }
    return dp[m][n]
}`,
  'lc-078': `import "math"

func maxProfit(prices []int) int {
    minPrice := math.MaxInt32
    maxProfit := 0
    for _, price := range prices {
        if price < minPrice {
            minPrice = price
        }
        profit := price - minPrice
        if profit > maxProfit {
            maxProfit = profit
        }
    }
    return maxProfit
}`,
  'lc-079': `func canJump(nums []int) bool {
    maxReach := 0
    for i := 0; i < len(nums); i++ {
        if i > maxReach {
            return false
        }
        if i+nums[i] > maxReach {
            maxReach = i + nums[i]
        }
        if maxReach >= len(nums)-1 {
            return true
        }
    }
    return true
}`,
  'lc-080': `func jump(nums []int) int {
    n := len(nums)
    if n == 1 {
        return 0
    }
    jumps, curEnd, curFarthest := 0, 0, 0
    for i := 0; i < n-1; i++ {
        if i+nums[i] > curFarthest {
            curFarthest = i + nums[i]
        }
        if i == curEnd {
            jumps++
            curEnd = curFarthest
        }
    }
    return jumps
}`,
  'lc-081': `func findKthLargest(nums []int, k int) int {
    h := &minHeap{}
    for _, num := range nums {
        heap.Push(h, num)
        if h.Len() > k {
            heap.Pop(h)
        }
    }
    return (*h)[0]
}

type minHeap []int

func (h minHeap) Len() int           { return len(h) }
func (h minHeap) Less(i, j int) bool { return h[i] < h[j] }
func (h minHeap) Swap(i, j int)      { h[i], h[j] = h[j], h[i] }
func (h *minHeap) Push(x any)        { *h = append(*h, x.(int)) }
func (h *minHeap) Pop() any {
    old := *h
    n := len(old)
    x := old[n-1]
    *h = old[:n-1]
    return x
}`,
  'lc-082': `func topKFrequent(nums []int, k int) []int {
    freq := make(map[int]int)
    for _, num := range nums {
        freq[num]++
    }
    buckets := make([][]int, len(nums)+1)
    for num, f := range freq {
        buckets[f] = append(buckets[f], num)
    }
    var res []int
    for i := len(buckets) - 1; i >= 0 && len(res) < k; i-- {
        res = append(res, buckets[i]...)
    }
    return res[:k]
}`,
  'lc-083': `import "container/heap"

type MaxHeap []int // store negative for max heap
func (h MaxHeap) Len() int           { return len(h) }
func (h MaxHeap) Less(i, j int) bool { return h[i] < h[j] }
func (h MaxHeap) Swap(i, j int)      { h[i], h[j] = h[j], h[i] }
func (h *MaxHeap) Push(x any)        { *h = append(*h, x.(int)) }
func (h *MaxHeap) Pop() any {
    old := *h; n := len(old); x := old[n-1]; *h = old[:n-1]; return x
}

type MinHeap []int
func (h MinHeap) Len() int           { return len(h) }
func (h MinHeap) Less(i, j int) bool { return h[i] < h[j] }
func (h MinHeap) Swap(i, j int)      { h[i], h[j] = h[j], h[i] }
func (h *MinHeap) Push(x any)        { *h = append(*h, x.(int)) }
func (h *MinHeap) Pop() any {
    old := *h; n := len(old); x := old[n-1]; *h = old[:n-1]; return x
}

type MedianFinder struct {
    small *MaxHeap
    large *MinHeap
}

func Constructor() MedianFinder {
    return MedianFinder{&MaxHeap{}, &MinHeap{}}
}

func (m *MedianFinder) AddNum(num int) {
    heap.Push(m.small, -num)
    heap.Push(m.large, -heap.Pop(m.small).(int))
    if m.large.Len() > m.small.Len() {
        heap.Push(m.small, -heap.Pop(m.large).(int))
    }
}

func (m *MedianFinder) FindMedian() float64 {
    if m.small.Len() > m.large.Len() {
        return float64(-(*m.small)[0])
    }
    return float64(-(*m.small)[0]+(*m.large)[0]) / 2
}`,
  'lc-084': `import "sort"

func merge(intervals [][]int) [][]int {
    sort.Slice(intervals, func(i, j int) bool {
        return intervals[i][0] < intervals[j][0]
    })
    var res [][]int
    for _, interval := range intervals {
        if len(res) == 0 || res[len(res)-1][1] < interval[0] {
            res = append(res, interval)
        } else {
            if interval[1] > res[len(res)-1][1] {
                res[len(res)-1][1] = interval[1]
            }
        }
    }
    return res
}`,
  'lc-085': `func sortColors(nums []int) {
    p0, cur, p2 := 0, 0, len(nums)-1
    for cur <= p2 {
        if nums[cur] == 0 {
            nums[p0], nums[cur] = nums[cur], nums[p0]
            p0++
            cur++
        } else if nums[cur] == 2 {
            nums[cur], nums[p2] = nums[p2], nums[cur]
            p2--
        } else {
            cur++
        }
    }
}`,
  'lc-086': `func sortList(head *ListNode) *ListNode {
    if head == nil || head.Next == nil {
        return head
    }
    slow, fast := head, head.Next
    for fast != nil && fast.Next != nil {
        slow = slow.Next
        fast = fast.Next.Next
    }
    mid := slow.Next
    slow.Next = nil
    left := sortList(head)
    right := sortList(mid)
    return merge(left, right)
}

func merge(l1, l2 *ListNode) *ListNode {
    dummy := &ListNode{}
    cur := dummy
    for l1 != nil && l2 != nil {
        if l1.Val < l2.Val {
            cur.Next = l1
            l1 = l1.Next
        } else {
            cur.Next = l2
            l2 = l2.Next
        }
        cur = cur.Next
    }
    if l1 != nil {
        cur.Next = l1
    } else {
        cur.Next = l2
    }
    return dummy.Next
}`,
  'lc-087': `type Node struct {
    key, val int
    prev, next *Node
}

type LRUCache struct {
    cap int
    cache map[int]*Node
    head, tail *Node
}

func Constructor(capacity int) LRUCache {
    head := &Node{}
    tail := &Node{}
    head.next = tail
    tail.prev = head
    return LRUCache{
        cap:   capacity,
        cache: make(map[int]*Node),
        head:  head,
        tail:  tail,
    }
}

func (l *LRUCache) remove(node *Node) {
    node.prev.next = node.next
    node.next.prev = node.prev
}

func (l *LRUCache) addToHead(node *Node) {
    node.next = l.head.next
    node.prev = l.head
    l.head.next.prev = node
    l.head.next = node
}

func (l *LRUCache) moveToHead(node *Node) {
    l.remove(node)
    l.addToHead(node)
}

func (l *LRUCache) Get(key int) int {
    if node, ok := l.cache[key]; ok {
        l.moveToHead(node)
        return node.val
    }
    return -1
}

func (l *LRUCache) Put(key int, value int) {
    if node, ok := l.cache[key]; ok {
        node.val = value
        l.moveToHead(node)
        return
    }
    node := &Node{key: key, val: value}
    l.cache[key] = node
    l.addToHead(node)
    if len(l.cache) > l.cap {
        tail := l.tail.prev
        l.remove(tail)
        delete(l.cache, tail.key)
    }
}`,
  'lc-088': `import "math/rand"

type RandomizedSet struct {
    nums []int
    pos  map[int]int
}

func Constructor() RandomizedSet {
    return RandomizedSet{pos: make(map[int]int)}
}

func (s *RandomizedSet) Insert(val int) bool {
    if _, ok := s.pos[val]; ok {
        return false
    }
    s.pos[val] = len(s.nums)
    s.nums = append(s.nums, val)
    return true
}

func (s *RandomizedSet) Remove(val int) bool {
    idx, ok := s.pos[val]
    if !ok {
        return false
    }
    last := s.nums[len(s.nums)-1]
    s.nums[idx] = last
    s.pos[last] = idx
    s.nums = s.nums[:len(s.nums)-1]
    delete(s.pos, val)
    return true
}

func (s *RandomizedSet) GetRandom() int {
    return s.nums[rand.Intn(len(s.nums))]
}`,
  'lc-089': `func singleNumber(nums []int) int {
    res := 0
    for _, num := range nums {
        res ^= num
    }
    return res
}`,
  'lc-090': `func majorityElement(nums []int) int {
    candidate, count := 0, 0
    for _, num := range nums {
        if count == 0 {
            candidate = num
        }
        if num == candidate {
            count++
        } else {
            count--
        }
    }
    return candidate
}`,
  'lc-091': `func productExceptSelf(nums []int) []int {
    n := len(nums)
    ans := make([]int, n)
    ans[0] = 1
    for i := 1; i < n; i++ {
        ans[i] = ans[i-1] * nums[i-1]
    }
    suffix := 1
    for i := n - 1; i >= 0; i-- {
        ans[i] *= suffix
        suffix *= nums[i]
    }
    return ans
}`,
  'lc-092': `func nextPermutation(nums []int) {
    n := len(nums)
    i := n - 2
    for i >= 0 && nums[i] >= nums[i+1] {
        i--
    }
    if i >= 0 {
        j := n - 1
        for nums[j] <= nums[i] {
            j--
        }
        nums[i], nums[j] = nums[j], nums[i]
    }
    for l, r := i+1, n-1; l < r; l, r = l+1, r-1 {
        nums[l], nums[r] = nums[r], nums[l]
    }
}`,
  'lc-093': `func findDuplicate(nums []int) int {
    slow, fast := nums[0], nums[0]
    for {
        slow = nums[slow]
        fast = nums[nums[fast]]
        if slow == fast {
            break
        }
    }
    slow = nums[0]
    for slow != fast {
        slow = nums[slow]
        fast = nums[fast]
    }
    return slow
}`,
  'lc-094': `func searchMatrix(matrix [][]int, target int) bool {
    m, n := len(matrix), len(matrix[0])
    i, j := 0, n-1
    for i < m && j >= 0 {
        if matrix[i][j] == target {
            return true
        } else if matrix[i][j] > target {
            j--
        } else {
            i++
        }
    }
    return false
}`,
  'lc-095': `func rotate(nums []int, k int) {
    n := len(nums)
    k %= n
    reverse := func(l, r int) {
        for l < r {
            nums[l], nums[r] = nums[r], nums[l]
            l++
            r--
        }
    }
    reverse(0, n-1)
    reverse(0, k-1)
    reverse(k, n-1)
}`,
  'lc-096': `func sortedArrayToBST(nums []int) *TreeNode {
    var build func(l, r int) *TreeNode
    build = func(l, r int) *TreeNode {
        if l > r {
            return nil
        }
        mid := l + (r-l)/2
        root := &TreeNode{Val: nums[mid]}
        root.Left = build(l, mid-1)
        root.Right = build(mid+1, r)
        return root
    }
    return build(0, len(nums)-1)
}`,
  'lc-097': `func generate(numRows int) [][]int {
    res := make([][]int, 0, numRows)
    for i := 0; i < numRows; i++ {
        row := make([]int, i+1)
        row[0], row[i] = 1, 1
        for j := 1; j < i; j++ {
            row[j] = res[i-1][j-1] + res[i-1][j]
        }
        res = append(res, row)
    }
    return res
}`,
  'lc-098': `func findDisappearedNumbers(nums []int) []int {
    for _, num := range nums {
        idx := abs(num) - 1
        nums[idx] = -abs(nums[idx])
    }
    var res []int
    for i := 0; i < len(nums); i++ {
        if nums[i] > 0 {
            res = append(res, i+1)
        }
    }
    return res
}

func abs(x int) int {
    if x < 0 {
        return -x
    }
    return x
}`,
  'lc-099': `func letterCombinations(digits string) []string {
    if len(digits) == 0 {
        return nil
    }
    mapping := map[byte]string{
        '2': "abc", '3': "def", '4': "ghi", '5': "jkl",
        '6': "mno", '7': "pqrs", '8': "tuv", '9': "wxyz",
    }
    var res []string
    var backtrack func(idx int, path []byte)
    backtrack = func(idx int, path []byte) {
        if idx == len(digits) {
            res = append(res, string(path))
            return
        }
        for _, ch := range mapping[digits[idx]] {
            backtrack(idx+1, append(path, byte(ch)))
        }
    }
    backtrack(0, []byte{})
    return res
}`,
  'lc-100': `func countBits(n int) []int {
    dp := make([]int, n+1)
    for i := 1; i <= n; i++ {
        dp[i] = dp[i>>1] + (i & 1)
    }
    return dp
}`
};
