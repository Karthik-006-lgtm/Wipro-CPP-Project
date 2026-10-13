from typing import List, Optional, Dict
from app.schemas.coding import CodingProblem, CodingProblemExample, CodingTestCase

# Master list of supported topic categories in the coding platform
TOPIC_CATEGORIES: List[str] = [
    "All Topics",
    "Basic Programming",
    "Numbers & Mathematics",
    "Patterns & Loops",
    "Arrays",
    "Strings",
    "Searching",
    "Sorting",
    "Hashing & Maps",
    "Two Pointers",
    "Sliding Window",
    "Recursion",
    "Backtracking",
    "Linked Lists",
    "Stacks",
    "Queues & Deques",
    "Trees & Binary Trees",
    "Binary Search Trees",
    "Heaps & Priority Queues",
    "Graphs",
    "Breadth-First Search (BFS)",
    "Depth-First Search (DFS)",
    "Greedy Algorithms",
    "Dynamic Programming",
    "Bit Manipulation",
    "Intervals",
    "Matrices & 2D Arrays",
    "Object-Oriented Programming (OOP)",
    "Classes & Inheritance",
    "Exception Handling",
    "Collections & Data Structures",
    "Advanced DSA",
    "Mixed Interview Problems",
]

# Helper to generate starter code templates across all 5 supported runtimes
def _generate_starters(func_name: str, py_body: str, cpp_body: str, java_body: str, js_body: str, ts_body: str) -> Dict[str, str]:
    return {
        "python": py_body.strip() + "\n",
        "cpp": cpp_body.strip() + "\n",
        "java": java_body.strip() + "\n",
        "javascript": js_body.strip() + "\n",
        "typescript": ts_body.strip() + "\n",
    }


ALL_PROBLEMS: List[CodingProblem] = [
    # -------------------------------------------------------------------------
    # 1. BASIC PROGRAMMING & MATH
    # -------------------------------------------------------------------------
    CodingProblem(
        id="fizzbuzz",
        title="FizzBuzz Simulation",
        difficulty="Easy",
        category="Basic Programming",
        description=(
            "Given an integer `n`, output numbers from 1 to `n` on a single line separated by space.\n"
            "For multiples of 3, output 'Fizz' instead of the number.\n"
            "For multiples of 5, output 'Buzz'.\n"
            "For multiples of both 3 and 5, output 'FizzBuzz'."
        ),
        examples=[
            CodingProblemExample(input="5", output="1 2 Fizz 4 Buzz", explanation="1, 2, 3->Fizz, 4, 5->Buzz"),
            CodingProblemExample(input="15", output="1 2 Fizz 4 Buzz Fizz 7 8 Fizz Buzz 11 Fizz 13 14 FizzBuzz"),
        ],
        constraints=["1 <= n <= 1000"],
        hints=["Use modulo operator % to test divisibility by 15, then 3, then 5."],
        test_cases=[
            CodingTestCase(input="5\n", expected_output="1 2 Fizz 4 Buzz"),
            CodingTestCase(input="3\n", expected_output="1 2 Fizz"),
            CodingTestCase(input="15\n", expected_output="1 2 Fizz 4 Buzz Fizz 7 8 Fizz Buzz 11 Fizz 13 14 FizzBuzz"),
        ],
        starter_code=_generate_starters(
            "fizzbuzz",
            """import sys

def solve():
    raw = sys.stdin.read().strip()
    if not raw: return
    n = int(raw)
    res = []
    for i in range(1, n + 1):
        if i % 15 == 0: res.append("FizzBuzz")
        elif i % 3 == 0: res.append("Fizz")
        elif i % 5 == 0: res.append("Buzz")
        else: res.append(str(i))
    print(" ".join(res))

if __name__ == '__main__':
    solve()""",
            """#include <iostream>
#include <string>

int main() {
    int n;
    if (std::cin >> n) {
        for (int i = 1; i <= n; ++i) {
            if (i % 15 == 0) std::cout << "FizzBuzz";
            else if (i % 3 == 0) std::cout << "Fizz";
            else if (i % 5 == 0) std::cout << "Buzz";
            else std::cout << i;
            if (i < n) std::cout << " ";
        }
        std::cout << std::endl;
    }
    return 0;
}""",
            """import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNextInt()) {
            int n = sc.nextInt();
            StringBuilder sb = new StringBuilder();
            for (int i = 1; i <= n; i++) {
                if (i % 15 == 0) sb.append("FizzBuzz");
                else if (i % 3 == 0) sb.append("Fizz");
                else if (i % 5 == 0) sb.append("Buzz");
                else sb.append(i);
                if (i < n) sb.append(" ");
            }
            System.out.println(sb.toString());
        }
    }
}""",
            """const fs = require('fs');

function solve() {
    const input = fs.readFileSync(0, 'utf-8').trim();
    if (!input) return;
    const n = parseInt(input, 10);
    const res = [];
    for (let i = 1; i <= n; i++) {
        if (i % 15 === 0) res.push('FizzBuzz');
        else if (i % 3 === 0) res.push('Fizz');
        else if (i % 5 === 0) res.push('Buzz');
        else res.push(String(i));
    }
    console.log(res.join(' '));
}

solve();""",
            """import * as fs from 'fs';

function solve(): void {
    const input = fs.readFileSync(0, 'utf-8').trim();
    if (!input) return;
    const n: number = parseInt(input, 10);
    const res: string[] = [];
    for (let i = 1; i <= n; i++) {
        if (i % 15 === 0) res.push('FizzBuzz');
        else if (i % 3 === 0) res.push('Fizz');
        else if (i % 5 === 0) res.push('Buzz');
        else res.push(String(i));
    }
    console.log(res.join(' '));
}

solve();"""
        )
    ),

    CodingProblem(
        id="palindrome-number",
        title="Palindrome Integer",
        difficulty="Easy",
        category="Numbers & Mathematics",
        description=(
            "Given an integer `x`, print `true` if `x` is a palindrome, and `false` otherwise.\n"
            "An integer is a palindrome when it reads the same forward and backward.\n"
            "Negative integers are not palindromes."
        ),
        examples=[
            CodingProblemExample(input="121", output="true", explanation="121 reads as 121 from left to right and right to left."),
            CodingProblemExample(input="-121", output="false", explanation="Reads -121 from left and 121- from right."),
            CodingProblemExample(input="10", output="false"),
        ],
        constraints=["-2^31 <= x <= 2^31 - 1"],
        hints=["Negative numbers cannot be palindromes because of the minus sign."],
        test_cases=[
            CodingTestCase(input="121\n", expected_output="true"),
            CodingTestCase(input="-121\n", expected_output="false"),
            CodingTestCase(input="10\n", expected_output="false"),
            CodingTestCase(input="0\n", expected_output="true"),
        ],
        starter_code=_generate_starters(
            "palindrome_number",
            """import sys

def solve():
    raw = sys.stdin.read().strip()
    if not raw: return
    s = raw
    if s == s[::-1]:
        print("true")
    else:
        print("false")

if __name__ == '__main__':
    solve()""",
            """#include <iostream>
#include <string>
#include <algorithm>

int main() {
    std::string s;
    if (std::cin >> s) {
        std::string rev = s;
        std::reverse(rev.begin(), rev.end());
        std::cout << (s == rev ? "true" : "false") << std::endl;
    }
    return 0;
}""",
            """import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNext()) {
            String s = sc.next().trim();
            String rev = new StringBuilder(s).reverse().toString();
            System.out.println(s.equals(rev) ? "true" : "false");
        }
    }
}""",
            """const fs = require('fs');

function solve() {
    const s = fs.readFileSync(0, 'utf-8').trim();
    if (!s) return;
    const rev = s.split('').reverse().join('');
    console.log(s === rev ? 'true' : 'false');
}

solve();""",
            """import * as fs from 'fs';

function solve(): void {
    const s: string = fs.readFileSync(0, 'utf-8').trim();
    if (!s) return;
    const rev: string = s.split('').reverse().join('');
    console.log(s === rev ? 'true' : 'false');
}

solve();"""
        )
    ),

    CodingProblem(
        id="factorial-calc",
        title="Factorial of a Number",
        difficulty="Easy",
        category="Numbers & Mathematics",
        description=(
            "Given a non-negative integer `n`, compute its factorial `n!`.\n"
            "The factorial of 0 is 1. The factorial of n is the product of all positive integers less than or equal to n."
        ),
        examples=[
            CodingProblemExample(input="5", output="120", explanation="5 * 4 * 3 * 2 * 1 = 120"),
            CodingProblemExample(input="0", output="1"),
        ],
        constraints=["0 <= n <= 20"],
        hints=["For n=0 or 1, factorial is 1. For n>1, loop from 1 to n."],
        test_cases=[
            CodingTestCase(input="5\n", expected_output="120"),
            CodingTestCase(input="0\n", expected_output="1"),
            CodingTestCase(input="7\n", expected_output="5040"),
        ],
        starter_code=_generate_starters(
            "factorial",
            """import sys

def solve():
    raw = sys.stdin.read().strip()
    if not raw: return
    n = int(raw)
    ans = 1
    for i in range(1, n + 1):
        ans *= i
    print(ans)

if __name__ == '__main__':
    solve()""",
            """#include <iostream>

int main() {
    long long n;
    if (std::cin >> n) {
        long long ans = 1;
        for (long long i = 1; i <= n; ++i) ans *= i;
        std::cout << ans << std::endl;
    }
    return 0;
}""",
            """import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNextLong()) {
            long n = sc.nextLong();
            long ans = 1;
            for (long i = 1; i <= n; i++) ans *= i;
            System.out.println(ans);
        }
    }
}""",
            """const fs = require('fs');

function solve() {
    const raw = fs.readFileSync(0, 'utf-8').trim();
    if (!raw) return;
    const n = Number(raw);
    let ans = 1n;
    for (let i = 1n; i <= BigInt(n); i++) ans *= i;
    console.log(ans.toString());
}

solve();""",
            """import * as fs from 'fs';

function solve(): void {
    const raw = fs.readFileSync(0, 'utf-8').trim();
    if (!raw) return;
    const n = Number(raw);
    let ans = 1n;
    for (let i = 1n; i <= BigInt(n); i++) ans *= i;
    console.log(ans.toString());
}

solve();"""
        )
    ),

    CodingProblem(
        id="fibonacci-number",
        title="Fibonacci Number",
        difficulty="Easy",
        category="Numbers & Mathematics",
        description=(
            "The Fibonacci numbers form a sequence where F(0) = 0, F(1) = 1, and F(n) = F(n - 1) + F(n - 2) for n > 1.\n"
            "Given `n`, calculate `F(n)`."
        ),
        examples=[
            CodingProblemExample(input="2", output="1", explanation="F(2) = F(1) + F(0) = 1 + 0 = 1."),
            CodingProblemExample(input="4", output="3", explanation="F(4) = F(3) + F(2) = 2 + 1 = 3."),
        ],
        constraints=["0 <= n <= 30"],
        hints=["Use two variables to track the previous two values instead of recursion."],
        test_cases=[
            CodingTestCase(input="2\n", expected_output="1"),
            CodingTestCase(input="3\n", expected_output="2"),
            CodingTestCase(input="4\n", expected_output="3"),
            CodingTestCase(input="10\n", expected_output="55"),
        ],
        starter_code=_generate_starters(
            "fibonacci",
            """import sys

def solve():
    raw = sys.stdin.read().strip()
    if not raw: return
    n = int(raw)
    if n <= 0:
        print(0); return
    if n == 1:
        print(1); return
    a, b = 0, 1
    for _ in range(2, n + 1):
        a, b = b, a + b
    print(b)

if __name__ == '__main__':
    solve()""",
            """#include <iostream>

int main() {
    int n;
    if (std::cin >> n) {
        if (n <= 0) { std::cout << 0 << std::endl; return 0; }
        if (n == 1) { std::cout << 1 << std::endl; return 0; }
        long long a = 0, b = 1;
        for (int i = 2; i <= n; ++i) {
            long long temp = a + b;
            a = b;
            b = temp;
        }
        std::cout << b << std::endl;
    }
    return 0;
}""",
            """import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNextInt()) {
            int n = sc.nextInt();
            if (n <= 0) { System.out.println(0); return; }
            if (n == 1) { System.out.println(1); return; }
            long a = 0, b = 1;
            for (int i = 2; i <= n; i++) {
                long c = a + b;
                a = b;
                b = c;
            }
            System.out.println(b);
        }
    }
}""",
            """const fs = require('fs');

function solve() {
    const raw = fs.readFileSync(0, 'utf-8').trim();
    if (!raw) return;
    const n = Number(raw);
    if (n <= 0) { console.log(0); return; }
    if (n === 1) { console.log(1); return; }
    let a = 0, b = 1;
    for (let i = 2; i <= n; i++) {
        const c = a + b;
        a = b;
        b = c;
    }
    console.log(b);
}

solve();""",
            """import * as fs from 'fs';

function solve(): void {
    const raw = fs.readFileSync(0, 'utf-8').trim();
    if (!raw) return;
    const n = Number(raw);
    if (n <= 0) { console.log(0); return; }
    if (n === 1) { console.log(1); return; }
    let a = 0, b = 1;
    for (let i = 2; i <= n; i++) {
        const c = a + b;
        a = b;
        b = c;
    }
    console.log(b);
}

solve();"""
        )
    ),

    # -------------------------------------------------------------------------
    # 2. PATTERNS & LOOPS
    # -------------------------------------------------------------------------
    CodingProblem(
        id="star-triangle",
        title="Right Angled Star Pattern",
        difficulty="Easy",
        category="Patterns & Loops",
        description=(
            "Given an integer `n`, print a right-angled triangle pattern of asterisks `*` with `n` rows.\n"
            "Row 1 has 1 star, row 2 has 2 stars, ..., row n has n stars."
        ),
        examples=[
            CodingProblemExample(input="3", output="*\n**\n***"),
        ],
        constraints=["1 <= n <= 50"],
        hints=["Use a loop from 1 to n, repeating the '*' character row times."],
        test_cases=[
            CodingTestCase(input="3\n", expected_output="*\n**\n***"),
            CodingTestCase(input="1\n", expected_output="*"),
            CodingTestCase(input="4\n", expected_output="*\n**\n***\n****"),
        ],
        starter_code=_generate_starters(
            "star_triangle",
            """import sys

def solve():
    raw = sys.stdin.read().strip()
    if not raw: return
    n = int(raw)
    for i in range(1, n + 1):
        print("*" * i)

if __name__ == '__main__':
    solve()""",
            """#include <iostream>
#include <string>

int main() {
    int n;
    if (std::cin >> n) {
        for (int i = 1; i <= n; ++i) {
            std::cout << std::string(i, '*') << std::endl;
        }
    }
    return 0;
}""",
            """import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNextInt()) {
            int n = sc.nextInt();
            for (int i = 1; i <= n; i++) {
                System.out.println("*".repeat(i));
            }
        }
    }
}""",
            """const fs = require('fs');

function solve() {
    const raw = fs.readFileSync(0, 'utf-8').trim();
    if (!raw) return;
    const n = Number(raw);
    for (let i = 1; i <= n; i++) {
        console.log('*'.repeat(i));
    }
}

solve();""",
            """import * as fs from 'fs';

function solve(): void {
    const raw = fs.readFileSync(0, 'utf-8').trim();
    if (!raw) return;
    const n = Number(raw);
    for (let i = 1; i <= n; i++) {
        console.log('*'.repeat(i));
    }
}

solve();"""
        )
    ),

    # -------------------------------------------------------------------------
    # 3. ARRAYS
    # -------------------------------------------------------------------------
    CodingProblem(
        id="two-sum",
        title="Two Sum Indices",
        difficulty="Easy",
        category="Arrays",
        description=(
            "Given an array of integers `nums` and an integer `target`, return the indices of the "
            "two numbers such that they add up to `target`.\n\n"
            "Input format:\n"
            "Line 1: space-separated integers for nums\n"
            "Line 2: target integer\n\n"
            "Output the zero-based indices separated by a space (e.g. `0 1`)."
        ),
        examples=[
            CodingProblemExample(input="2 7 11 15\n9", output="0 1", explanation="nums[0] + nums[1] == 2 + 7 == 9."),
            CodingProblemExample(input="3 2 4\n6", output="1 2"),
        ],
        constraints=["2 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9"],
        hints=["Use a hash map to store each number and its index. Check if target - num exists in the map."],
        test_cases=[
            CodingTestCase(input="2 7 11 15\n9\n", expected_output="0 1"),
            CodingTestCase(input="3 2 4\n6\n", expected_output="1 2"),
            CodingTestCase(input="3 3\n6\n", expected_output="0 1"),
        ],
        starter_code=_generate_starters(
            "two_sum",
            """import sys

def solve():
    lines = sys.stdin.read().strip().split('\\n')
    if len(lines) < 2: return
    nums = list(map(int, lines[0].split()))
    target = int(lines[1].strip())
    
    seen = {}
    for idx, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            print(f"{seen[diff]} {idx}")
            return
        seen[num] = idx

if __name__ == '__main__':
    solve()""",
            """#include <iostream>
#include <vector>
#include <unordered_map>
#include <sstream>

int main() {
    std::string line;
    if (!std::getline(std::cin, line)) return 0;
    std::stringstream ss(line);
    std::vector<int> nums;
    int x;
    while (ss >> x) nums.push_back(x);
    int target;
    if (!(std::cin >> target)) return 0;

    std::unordered_map<int, int> seen;
    for (int i = 0; i < (int)nums.size(); ++i) {
        int diff = target - nums[i];
        if (seen.count(diff)) {
            std::cout << seen[diff] << " " << i << std::endl;
            return 0;
        }
        seen[nums[i]] = i;
    }
    return 0;
}""",
            """import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextLine()) return;
        String[] parts = sc.nextLine().trim().split("\\\\s+");
        int[] nums = new int[parts.length];
        for (int i = 0; i < parts.length; i++) nums[i] = Integer.parseInt(parts[i]);
        if (!sc.hasNextInt()) return;
        int target = sc.nextInt();

        Map<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int diff = target - nums[i];
            if (seen.containsKey(diff)) {
                System.out.println(seen.get(diff) + " " + i);
                return;
            }
            seen.put(nums[i], i);
        }
    }
}""",
            """const fs = require('fs');

function solve() {
    const lines = fs.readFileSync(0, 'utf-8').trim().split('\\n');
    if (lines.length < 2) return;
    const nums = lines[0].trim().split(/\\s+/).map(Number);
    const target = Number(lines[1].trim());

    const seen = new Map();
    for (let i = 0; i < nums.length; i++) {
        const diff = target - nums[i];
        if (seen.has(diff)) {
            console.log(`${seen.get(diff)} ${i}`);
            return;
        }
        seen.set(nums[i], i);
    }
}

solve();""",
            """import * as fs from 'fs';

function solve(): void {
    const lines = fs.readFileSync(0, 'utf-8').trim().split('\\n');
    if (lines.length < 2) return;
    const nums: number[] = lines[0].trim().split(/\\s+/).map(Number);
    const target: number = Number(lines[1].trim());

    const seen = new Map<number, number>();
    for (let i = 0; i < nums.length; i++) {
        const diff: number = target - nums[i];
        if (seen.has(diff)) {
            console.log(`${seen.get(diff)} ${i}`);
            return;
        }
        seen.set(nums[i], i);
    }
}

solve();"""
        )
    ),

    CodingProblem(
        id="maximum-subarray",
        title="Maximum Subarray (Kadane's Algorithm)",
        difficulty="Medium",
        category="Arrays",
        description=(
            "Given an integer array `nums`, find the subarray with the largest sum, and return its sum.\n"
            "Input is a single line with space-separated integers."
        ),
        examples=[
            CodingProblemExample(input="-2 1 -3 4 -1 2 1 -5 4", output="6", explanation="The subarray [4,-1,2,1] has the largest sum 6."),
            CodingProblemExample(input="1", output="1"),
            CodingProblemExample(input="5 4 -1 7 8", output="23"),
        ],
        constraints=["1 <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4"],
        hints=["Maintain a current running sum. If it drops below current number, restart from current."],
        test_cases=[
            CodingTestCase(input="-2 1 -3 4 -1 2 1 -5 4\n", expected_output="6"),
            CodingTestCase(input="1\n", expected_output="1"),
            CodingTestCase(input="5 4 -1 7 8\n", expected_output="23"),
            CodingTestCase(input="-1 -2 -3\n", expected_output="-1"),
        ],
        starter_code=_generate_starters(
            "max_subarray",
            """import sys

def solve():
    raw = sys.stdin.read().strip()
    if not raw: return
    nums = list(map(int, raw.split()))
    max_sum = nums[0]
    cur_sum = nums[0]
    for x in nums[1:]:
        cur_sum = max(x, cur_sum + x)
        max_sum = max(max_sum, cur_sum)
    print(max_sum)

if __name__ == '__main__':
    solve()""",
            """#include <iostream>
#include <vector>
#include <algorithm>

int main() {
    int x;
    std::vector<int> nums;
    while (std::cin >> x) nums.push_back(x);
    if (nums.empty()) return 0;
    long long max_sum = nums[0], cur_sum = nums[0];
    for (size_t i = 1; i < nums.size(); ++i) {
        cur_sum = std::max((long long)nums[i], cur_sum + nums[i]);
        max_sum = std::max(max_sum, cur_sum);
    }
    std::cout << max_sum << std::endl;
    return 0;
}""",
            """import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        List<Integer> nums = new ArrayList<>();
        while (sc.hasNextInt()) nums.add(sc.nextInt());
        if (nums.isEmpty()) return;
        long max_sum = nums.get(0);
        long cur_sum = nums.get(0);
        for (int i = 1; i < nums.size(); i++) {
            cur_sum = Math.max(nums.get(i), cur_sum + nums.get(i));
            max_sum = Math.max(max_sum, cur_sum);
        }
        System.out.println(max_sum);
    }
}""",
            """const fs = require('fs');

function solve() {
    const raw = fs.readFileSync(0, 'utf-8').trim();
    if (!raw) return;
    const nums = raw.split(/\\s+/).map(Number);
    let maxSum = nums[0];
    let curSum = nums[0];
    for (let i = 1; i < nums.length; i++) {
        curSum = Math.max(nums[i], curSum + nums[i]);
        maxSum = Math.max(maxSum, curSum);
    }
    console.log(maxSum);
}

solve();""",
            """import * as fs from 'fs';

function solve(): void {
    const raw = fs.readFileSync(0, 'utf-8').trim();
    if (!raw) return;
    const nums: number[] = raw.split(/\\s+/).map(Number);
    let maxSum: number = nums[0];
    let curSum: number = nums[0];
    for (let i = 1; i < nums.length; i++) {
        curSum = Math.max(nums[i], curSum + nums[i]);
        maxSum = Math.max(maxSum, curSum);
    }
    console.log(maxSum);
}

solve();"""
        )
    ),

    CodingProblem(
        id="best-time-stock",
        title="Best Time to Buy and Sell Stock",
        difficulty="Easy",
        category="Arrays",
        description=(
            "You are given an array `prices` where `prices[i]` is the price of a given stock on the `i`th day.\n"
            "You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.\n"
            "Return the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return 0."
        ),
        examples=[
            CodingProblemExample(input="7 1 5 3 6 4", output="5", explanation="Buy on day 2 (price=1) and sell on day 5 (price=6), profit = 6 - 1 = 5."),
            CodingProblemExample(input="7 6 4 3 1", output="0", explanation="No profitable transactions possible."),
        ],
        constraints=["1 <= prices.length <= 10^5"],
        hints=["Track the minimum price seen so far and compare price - min_price at each step."],
        test_cases=[
            CodingTestCase(input="7 1 5 3 6 4\n", expected_output="5"),
            CodingTestCase(input="7 6 4 3 1\n", expected_output="0"),
            CodingTestCase(input="2 4 1\n", expected_output="2"),
        ],
        starter_code=_generate_starters(
            "max_profit",
            """import sys

def solve():
    raw = sys.stdin.read().strip()
    if not raw: return
    prices = list(map(int, raw.split()))
    min_p = float('inf')
    max_prof = 0
    for p in prices:
        if p < min_p: min_p = p
        elif p - min_p > max_prof: max_prof = p - min_p
    print(max_prof)

if __name__ == '__main__':
    solve()""",
            """#include <iostream>
#include <vector>
#include <algorithm>

int main() {
    int p;
    std::vector<int> prices;
    while (std::cin >> p) prices.push_back(p);
    if (prices.empty()) return 0;
    int min_p = prices[0], max_prof = 0;
    for (int price : prices) {
        min_p = std::min(min_p, price);
        max_prof = std::max(max_prof, price - min_p);
    }
    std::cout << max_prof << std::endl;
    return 0;
}""",
            """import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        List<Integer> prices = new ArrayList<>();
        while (sc.hasNextInt()) prices.add(sc.nextInt());
        if (prices.isEmpty()) return;
        int min_p = prices.get(0);
        int max_prof = 0;
        for (int p : prices) {
            min_p = Math.min(min_p, p);
            max_prof = Math.max(max_prof, p - min_p);
        }
        System.out.println(max_prof);
    }
}""",
            """const fs = require('fs');

function solve() {
    const raw = fs.readFileSync(0, 'utf-8').trim();
    if (!raw) return;
    const prices = raw.split(/\\s+/).map(Number);
    let minP = prices[0], maxProf = 0;
    for (const p of prices) {
        minP = Math.min(minP, p);
        maxProf = Math.max(maxProf, p - minP);
    }
    console.log(maxProf);
}

solve();""",
            """import * as fs from 'fs';

function solve(): void {
    const raw = fs.readFileSync(0, 'utf-8').trim();
    if (!raw) return;
    const prices: number[] = raw.split(/\\s+/).map(Number);
    let minP = prices[0], maxProf = 0;
    for (const p of prices) {
        minP = Math.min(minP, p);
        maxProf = Math.max(maxProf, p - minP);
    }
    console.log(maxProf);
}

solve();"""
        )
    ),

    # -------------------------------------------------------------------------
    # 4. STRINGS
    # -------------------------------------------------------------------------
    CodingProblem(
        id="valid-palindrome",
        title="Valid Palindrome Phrase",
        difficulty="Easy",
        category="Strings",
        description=(
            "A phrase is a palindrome if, after converting all uppercase letters into lowercase letters "
            "and removing all non-alphanumeric characters, it reads the same forward and backward.\n\n"
            "Print `true` if it is a palindrome, or `false` otherwise."
        ),
        examples=[
            CodingProblemExample(input="A man, a plan, a canal: Panama", output="true"),
            CodingProblemExample(input="race a car", output="false"),
            CodingProblemExample(input=" ", output="true"),
        ],
        constraints=["1 <= s.length <= 2 * 10^5"],
        hints=["Filter out non-alphanumeric characters and lowercase the string before checking."],
        test_cases=[
            CodingTestCase(input="A man, a plan, a canal: Panama\n", expected_output="true"),
            CodingTestCase(input="race a car\n", expected_output="false"),
            CodingTestCase(input=" \n", expected_output="true"),
            CodingTestCase(input="0P\n", expected_output="false"),
        ],
        starter_code=_generate_starters(
            "is_palindrome",
            """import sys

def solve():
    s = sys.stdin.read().strip()
    cleaned = [c.lower() for c in s if c.isalnum()]
    print("true" if cleaned == cleaned[::-1] else "false")

if __name__ == '__main__':
    solve()""",
            """#include <iostream>
#include <string>
#include <cctype>

int main() {
    std::string s;
    std::getline(std::cin, s);
    std::string cleaned;
    for (char c : s) {
        if (std::isalnum(c)) cleaned += std::tolower(c);
    }
    int l = 0, r = (int)cleaned.size() - 1;
    bool ok = true;
    while (l < r) {
        if (cleaned[l++] != cleaned[r--]) { ok = false; break; }
    }
    std::cout << (ok ? "true" : "false") << std::endl;
    return 0;
}""",
            """import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.hasNextLine() ? sc.nextLine() : "";
        StringBuilder sb = new StringBuilder();
        for (char c : s.toCharArray()) {
            if (Character.isLetterOrDigit(c)) sb.append(Character.toLowerCase(c));
        }
        String clean = sb.toString();
        String rev = sb.reverse().toString();
        System.out.println(clean.equals(rev) ? "true" : "false");
    }
}""",
            """const fs = require('fs');

function solve() {
    const s = fs.readFileSync(0, 'utf-8').trim();
    const clean = s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const rev = clean.split('').reverse().join('');
    console.log(clean === rev ? 'true' : 'false');
}

solve();""",
            """import * as fs from 'fs';

function solve(): void {
    const s: string = fs.readFileSync(0, 'utf-8').trim();
    const clean: string = s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const rev: string = clean.split('').reverse().join('');
    console.log(clean === rev ? 'true' : 'false');
}

solve();"""
        )
    ),

    CodingProblem(
        id="valid-anagram",
        title="Valid Anagram",
        difficulty="Easy",
        category="Strings",
        description=(
            "Given two strings `s` and `t` separated by a newline, return `true` if `t` is an anagram of `s`, and `false` otherwise.\n"
            "An anagram is a word formed by rearranging the letters of another word."
        ),
        examples=[
            CodingProblemExample(input="anagram\nnagaram", output="true"),
            CodingProblemExample(input="rat\ncar", output="false"),
        ],
        constraints=["1 <= s.length, t.length <= 5 * 10^4"],
        hints=["Sort both strings or count frequency of characters in a hash map."],
        test_cases=[
            CodingTestCase(input="anagram\nnagaram\n", expected_output="true"),
            CodingTestCase(input="rat\ncar\n", expected_output="false"),
            CodingTestCase(input="a\na\n", expected_output="true"),
        ],
        starter_code=_generate_starters(
            "is_anagram",
            """import sys

def solve():
    lines = sys.stdin.read().strip().split('\\n')
    if len(lines) < 2: return
    s, t = lines[0].strip(), lines[1].strip()
    print("true" if sorted(s) == sorted(t) else "false")

if __name__ == '__main__':
    solve()""",
            """#include <iostream>
#include <string>
#include <algorithm>

int main() {
    std::string s, t;
    if (std::cin >> s >> t) {
        std::sort(s.begin(), s.end());
        std::sort(t.begin(), t.end());
        std::cout << (s == t ? "true" : "false") << std::endl;
    }
    return 0;
}""",
            """import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNext()) {
            String s = sc.next();
            if (!sc.hasNext()) return;
            String t = sc.next();
            char[] a = s.toCharArray();
            char[] b = t.toCharArray();
            Arrays.sort(a);
            Arrays.sort(b);
            System.out.println(Arrays.equals(a, b) ? "true" : "false");
        }
    }
}""",
            """const fs = require('fs');

function solve() {
    const lines = fs.readFileSync(0, 'utf-8').trim().split('\\n');
    if (lines.length < 2) return;
    const s = lines[0].trim().split('').sort().join('');
    const t = lines[1].trim().split('').sort().join('');
    console.log(s === t ? 'true' : 'false');
}

solve();""",
            """import * as fs from 'fs';

function solve(): void {
    const lines = fs.readFileSync(0, 'utf-8').trim().split('\\n');
    if (lines.length < 2) return;
    const s = lines[0].trim().split('').sort().join('');
    const t = lines[1].trim().split('').sort().join('');
    console.log(s === t ? 'true' : 'false');
}

solve();"""
        )
    ),

    CodingProblem(
        id="reverse-words",
        title="Reverse Words in a String",
        difficulty="Medium",
        category="Strings",
        description=(
            "Given an input string `s`, reverse the order of the words.\n"
            "A word is defined as a sequence of non-space characters.\n"
            "The returned string should only have a single space separating the words. Do not include any extra spaces."
        ),
        examples=[
            CodingProblemExample(input="the sky is blue", output="blue is sky the"),
            CodingProblemExample(input="  hello world  ", output="world hello"),
            CodingProblemExample(input="a good   example", output="example good a"),
        ],
        constraints=["1 <= s.length <= 10^4"],
        hints=["Split by whitespace to automatically remove consecutive spaces, reverse the list, then join."],
        test_cases=[
            CodingTestCase(input="the sky is blue\n", expected_output="blue is sky the"),
            CodingTestCase(input="  hello world  \n", expected_output="world hello"),
            CodingTestCase(input="a good   example\n", expected_output="example good a"),
        ],
        starter_code=_generate_starters(
            "reverse_words",
            """import sys

def solve():
    s = sys.stdin.read().strip()
    words = s.split()
    print(" ".join(reversed(words)))

if __name__ == '__main__':
    solve()""",
            """#include <iostream>
#include <vector>
#include <sstream>

int main() {
    std::string line;
    if (std::getline(std::cin, line)) {
        std::stringstream ss(line);
        std::string word;
        std::vector<std::string> words;
        while (ss >> word) words.push_back(word);
        for (int i = (int)words.size() - 1; i >= 0; --i) {
            std::cout << words[i];
            if (i > 0) std::cout << " ";
        }
        std::cout << std::endl;
    }
    return 0;
}""",
            """import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNextLine()) {
            String[] words = sc.nextLine().trim().split("\\\\s+");
            StringBuilder sb = new StringBuilder();
            for (int i = words.length - 1; i >= 0; i--) {
                sb.append(words[i]);
                if (i > 0) sb.append(" ");
            }
            System.out.println(sb.toString());
        }
    }
}""",
            """const fs = require('fs');

function solve() {
    const s = fs.readFileSync(0, 'utf-8').trim();
    const words = s.split(/\\s+/).filter(Boolean);
    console.log(words.reverse().join(' '));
}

solve();""",
            """import * as fs from 'fs';

function solve(): void {
    const s: string = fs.readFileSync(0, 'utf-8').trim();
    const words: string[] = s.split(/\\s+/).filter(Boolean);
    console.log(words.reverse().join(' '));
}

solve();"""
        )
    ),

    # -------------------------------------------------------------------------
    # 5. SEARCHING & SORTING
    # -------------------------------------------------------------------------
    CodingProblem(
        id="binary-search",
        title="Binary Search Target",
        difficulty="Easy",
        category="Searching",
        description=(
            "Given an array of integers `nums` which is sorted in ascending order, and an integer `target`,\n"
            "write a function to search `target` in `nums`. If `target` exists, then return its index. Otherwise, return -1.\n\n"
            "Line 1: space-separated sorted integers for nums\n"
            "Line 2: target integer"
        ),
        examples=[
            CodingProblemExample(input="-1 0 3 5 9 12\n9", output="4", explanation="9 exists in nums and its index is 4."),
            CodingProblemExample(input="-1 0 3 5 9 12\n2", output="-1", explanation="2 does not exist in nums so return -1."),
        ],
        constraints=["1 <= nums.length <= 10^4", "All integers in nums are unique."],
        hints=["Use two pointers `low` and `high`, compute `mid = (low + high) // 2`."],
        test_cases=[
            CodingTestCase(input="-1 0 3 5 9 12\n9\n", expected_output="4"),
            CodingTestCase(input="-1 0 3 5 9 12\n2\n", expected_output="-1"),
            CodingTestCase(input="5\n5\n", expected_output="0"),
        ],
        starter_code=_generate_starters(
            "binary_search",
            """import sys

def solve():
    lines = sys.stdin.read().strip().split('\\n')
    if len(lines) < 2: return
    nums = list(map(int, lines[0].split()))
    target = int(lines[1].strip())

    low, high = 0, len(nums) - 1
    ans = -1
    while low <= high:
        mid = (low + high) // 2
        if nums[mid] == target:
            ans = mid
            break
        elif nums[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    print(ans)

if __name__ == '__main__':
    solve()""",
            """#include <iostream>
#include <vector>
#include <sstream>

int main() {
    std::string line;
    if (!std::getline(std::cin, line)) return 0;
    std::stringstream ss(line);
    std::vector<int> nums;
    int x;
    while (ss >> x) nums.push_back(x);
    int target;
    if (!(std::cin >> target)) return 0;

    int low = 0, high = (int)nums.size() - 1, ans = -1;
    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (nums[mid] == target) { ans = mid; break; }
        else if (nums[mid] < target) low = mid + 1;
        else high = mid - 1;
    }
    std::cout << ans << std::endl;
    return 0;
}""",
            """import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextLine()) return;
        String[] parts = sc.nextLine().trim().split("\\\\s+");
        int[] nums = new int[parts.length];
        for (int i = 0; i < parts.length; i++) nums[i] = Integer.parseInt(parts[i]);
        if (!sc.hasNextInt()) return;
        int target = sc.nextInt();

        int low = 0, high = nums.length - 1, ans = -1;
        while (low <= high) {
            int mid = low + (high - low) / 2;
            if (nums[mid] == target) { ans = mid; break; }
            else if (nums[mid] < target) low = mid + 1;
            else high = mid - 1;
        }
        System.out.println(ans);
    }
}""",
            """const fs = require('fs');

function solve() {
    const lines = fs.readFileSync(0, 'utf-8').trim().split('\\n');
    if (lines.length < 2) return;
    const nums = lines[0].trim().split(/\\s+/).map(Number);
    const target = Number(lines[1].trim());

    let low = 0, high = nums.length - 1, ans = -1;
    while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        if (nums[mid] === target) { ans = mid; break; }
        else if (nums[mid] < target) low = mid + 1;
        else high = mid - 1;
    }
    console.log(ans);
}

solve();""",
            """import * as fs from 'fs';

function solve(): void {
    const lines = fs.readFileSync(0, 'utf-8').trim().split('\\n');
    if (lines.length < 2) return;
    const nums: number[] = lines[0].trim().split(/\\s+/).map(Number);
    const target: number = Number(lines[1].trim());

    let low = 0, high = nums.length - 1, ans = -1;
    while (low <= high) {
        const mid: number = Math.floor((low + high) / 2);
        if (nums[mid] === target) { ans = mid; break; }
        else if (nums[mid] < target) low = mid + 1;
        else high = mid - 1;
    }
    console.log(ans);
}

solve();"""
        )
    ),

    CodingProblem(
        id="sort-array",
        title="Sort Array in Ascending Order",
        difficulty="Easy",
        category="Sorting",
        description=(
            "Given an array of integers `nums`, sort the array in ascending order and output elements separated by a space."
        ),
        examples=[
            CodingProblemExample(input="5 2 3 1", output="1 2 3 5"),
            CodingProblemExample(input="5 1 1 2 0 0", output="0 0 1 1 2 5"),
        ],
        constraints=["1 <= nums.length <= 50000"],
        hints=["Use built-in sort or merge sort with O(n log n) complexity."],
        test_cases=[
            CodingTestCase(input="5 2 3 1\n", expected_output="1 2 3 5"),
            CodingTestCase(input="5 1 1 2 0 0\n", expected_output="0 0 1 1 2 5"),
            CodingTestCase(input="42\n", expected_output="42"),
        ],
        starter_code=_generate_starters(
            "sort_array",
            """import sys

def solve():
    raw = sys.stdin.read().strip()
    if not raw: return
    nums = sorted(list(map(int, raw.split())))
    print(" ".join(map(str, nums)))

if __name__ == '__main__':
    solve()""",
            """#include <iostream>
#include <vector>
#include <algorithm>

int main() {
    int x;
    std::vector<int> nums;
    while (std::cin >> x) nums.push_back(x);
    std::sort(nums.begin(), nums.end());
    for (size_t i = 0; i < nums.size(); ++i) {
        std::cout << nums[i];
        if (i + 1 < nums.size()) std::cout << " ";
    }
    std::cout << std::endl;
    return 0;
}""",
            """import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        List<Integer> nums = new ArrayList<>();
        while (sc.hasNextInt()) nums.add(sc.nextInt());
        Collections.sort(nums);
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < nums.size(); i++) {
            sb.append(nums.get(i));
            if (i + 1 < nums.size()) sb.append(" ");
        }
        System.out.println(sb.toString());
    }
}""",
            """const fs = require('fs');

function solve() {
    const raw = fs.readFileSync(0, 'utf-8').trim();
    if (!raw) return;
    const nums = raw.split(/\\s+/).map(Number).sort((a, b) => a - b);
    console.log(nums.join(' '));
}

solve();""",
            """import * as fs from 'fs';

function solve(): void {
    const raw = fs.readFileSync(0, 'utf-8').trim();
    if (!raw) return;
    const nums: number[] = raw.split(/\\s+/).map(Number).sort((a, b) => a - b);
    console.log(nums.join(' '));
}

solve();"""
        )
    ),

    # -------------------------------------------------------------------------
    # 6. STACKS & QUEUES
    # -------------------------------------------------------------------------
    CodingProblem(
        id="valid-parentheses",
        title="Valid Parentheses",
        difficulty="Easy",
        category="Stacks",
        description=(
            "Given a string `s` containing just the characters '(', ')', '{', '}', '[' and ']',\n"
            "determine if the input string is valid.\n"
            "An input string is valid if open brackets are closed by the same type of brackets and in the correct order.\n"
            "Print `true` if valid, and `false` otherwise."
        ),
        examples=[
            CodingProblemExample(input="()", output="true"),
            CodingProblemExample(input="()[]{}", output="true"),
            CodingProblemExample(input="(]", output="false"),
        ],
        constraints=["1 <= s.length <= 10^4"],
        hints=["Use a stack to push matching open brackets, and pop when encountering corresponding closing bracket."],
        test_cases=[
            CodingTestCase(input="()\n", expected_output="true"),
            CodingTestCase(input="()[]{}\n", expected_output="true"),
            CodingTestCase(input="(]\n", expected_output="false"),
            CodingTestCase(input="([)]\n", expected_output="false"),
            CodingTestCase(input="{[]}\n", expected_output="true"),
        ],
        starter_code=_generate_starters(
            "valid_parentheses",
            """import sys

def solve():
    s = sys.stdin.read().strip()
    stack = []
    pairs = {')': '(', '}': '{', ']': '['}
    for c in s:
        if c in pairs:
            if not stack or stack[-1] != pairs[c]:
                print("false"); return
            stack.pop()
        else:
            stack.append(c)
    print("true" if len(stack) == 0 else "false")

if __name__ == '__main__':
    solve()""",
            """#include <iostream>
#include <string>
#include <stack>
#include <unordered_map>

int main() {
    std::string s;
    if (std::cin >> s) {
        std::stack<char> st;
        std::unordered_map<char, char> p = {{')', '('}, {'}', '{'}, {']', '['}};
        bool ok = true;
        for (char c : s) {
            if (p.count(c)) {
                if (st.empty() || st.top() != p[c]) { ok = false; break; }
                st.pop();
            } else {
                st.push(c);
            }
        }
        if (ok && st.empty()) std::cout << "true" << std::endl;
        else std::cout << "false" << std::endl;
    }
    return 0;
}""",
            """import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNext()) {
            String s = sc.next();
            Deque<Character> st = new ArrayDeque<>();
            Map<Character, Character> p = Map.of(')', '(', '}', '{', ']', '[');
            boolean ok = true;
            for (char c : s.toCharArray()) {
                if (p.containsKey(c)) {
                    if (st.isEmpty() || st.pop() != p.get(c)) { ok = false; break; }
                } else {
                    st.push(c);
                }
            }
            System.out.println(ok && st.isEmpty() ? "true" : "false");
        }
    }
}""",
            """const fs = require('fs');

function solve() {
    const s = fs.readFileSync(0, 'utf-8').trim();
    const stack = [];
    const p = {')': '(', '}': '{', ']': '['};
    for (const c of s) {
        if (p[c]) {
            if (stack.pop() !== p[c]) { console.log('false'); return; }
        } else {
            stack.push(c);
        }
    }
    console.log(stack.length === 0 ? 'true' : 'false');
}

solve();""",
            """import * as fs from 'fs';

function solve(): void {
    const s: string = fs.readFileSync(0, 'utf-8').trim();
    const stack: string[] = [];
    const p: Record<string, string> = {')': '(', '}': '{', ']': '['};
    for (const c of s) {
        if (p[c]) {
            if (stack.pop() !== p[c]) { console.log('false'); return; }
        } else {
            stack.push(c);
        }
    }
    console.log(stack.length === 0 ? 'true' : 'false');
}

solve();"""
        )
    ),

    # -------------------------------------------------------------------------
    # 7. TWO POINTERS & SLIDING WINDOW
    # -------------------------------------------------------------------------
    CodingProblem(
        id="container-with-most-water",
        title="Container With Most Water",
        difficulty="Medium",
        category="Two Pointers",
        description=(
            "You are given an integer array `height` of length `n`.\n"
            "Find two lines that together with the x-axis form a container, such that the container contains the most water.\n"
            "Return the maximum amount of water a container can store."
        ),
        examples=[
            CodingProblemExample(input="1 8 6 2 5 4 8 3 7", output="49", explanation="The max area is between index 1 (height 8) and index 8 (height 7): min(8,7) * 7 = 49."),
            CodingProblemExample(input="1 1", output="1"),
        ],
        constraints=["n >= 2", "0 <= height[i] <= 10^4"],
        hints=["Use two pointers at the ends. Move the pointer pointing to the shorter line inward."],
        test_cases=[
            CodingTestCase(input="1 8 6 2 5 4 8 3 7\n", expected_output="49"),
            CodingTestCase(input="1 1\n", expected_output="1"),
            CodingTestCase(input="4 3 2 1 4\n", expected_output="16"),
        ],
        starter_code=_generate_starters(
            "max_water",
            """import sys

def solve():
    raw = sys.stdin.read().strip()
    if not raw: return
    h = list(map(int, raw.split()))
    l, r = 0, len(h) - 1
    max_area = 0
    while l < r:
        area = min(h[l], h[r]) * (r - l)
        max_area = max(max_area, area)
        if h[l] < h[r]: l += 1
        else: r -= 1
    print(max_area)

if __name__ == '__main__':
    solve()""",
            """#include <iostream>
#include <vector>
#include <algorithm>

int main() {
    int x;
    std::vector<int> h;
    while (std::cin >> x) h.push_back(x);
    int l = 0, r = (int)h.size() - 1, max_area = 0;
    while (l < r) {
        int area = std::min(h[l], h[r]) * (r - l);
        max_area = std::max(max_area, area);
        if (h[l] < h[r]) l++;
        else r--;
    }
    std::cout << max_area << std::endl;
    return 0;
}""",
            """import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        List<Integer> h = new ArrayList<>();
        while (sc.hasNextInt()) h.add(sc.nextInt());
        int l = 0, r = h.size() - 1, max_area = 0;
        while (l < r) {
            int area = Math.min(h.get(l), h.get(r)) * (r - l);
            max_area = Math.max(max_area, area);
            if (h.get(l) < h.get(r)) l++;
            else r--;
        }
        System.out.println(max_area);
    }
}""",
            """const fs = require('fs');

function solve() {
    const raw = fs.readFileSync(0, 'utf-8').trim();
    if (!raw) return;
    const h = raw.split(/\\s+/).map(Number);
    let l = 0, r = h.length - 1, maxArea = 0;
    while (l < r) {
        const area = Math.min(h[l], h[r]) * (r - l);
        maxArea = Math.max(maxArea, area);
        if (h[l] < h[r]) l++;
        else r--;
    }
    console.log(maxArea);
}

solve();""",
            """import * as fs from 'fs';

function solve(): void {
    const raw = fs.readFileSync(0, 'utf-8').trim();
    if (!raw) return;
    const h: number[] = raw.split(/\\s+/).map(Number);
    let l = 0, r = h.length - 1, maxArea = 0;
    while (l < r) {
        const area = Math.min(h[l], h[r]) * (r - l);
        maxArea = Math.max(maxArea, area);
        if (h[l] < h[r]) l++;
        else r--;
    }
    console.log(maxArea);
}

solve();"""
        )
    ),

    # -------------------------------------------------------------------------
    # 8. DYNAMIC PROGRAMMING
    # -------------------------------------------------------------------------
    CodingProblem(
        id="climbing-stairs",
        title="Climbing Stairs",
        difficulty="Easy",
        category="Dynamic Programming",
        description=(
            "You are climbing a staircase. It takes `n` steps to reach the top.\n"
            "Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?\n"
            "Given integer `n`, output the number of distinct ways."
        ),
        examples=[
            CodingProblemExample(input="2", output="2", explanation="1 step + 1 step, or 2 steps."),
            CodingProblemExample(input="3", output="3", explanation="1+1+1, 1+2, or 2+1."),
        ],
        constraints=["1 <= n <= 45"],
        hints=["Notice that ways(n) = ways(n-1) + ways(n-2). This is equivalent to Fibonacci."],
        test_cases=[
            CodingTestCase(input="2\n", expected_output="2"),
            CodingTestCase(input="3\n", expected_output="3"),
            CodingTestCase(input="5\n", expected_output="8"),
        ],
        starter_code=_generate_starters(
            "climb_stairs",
            """import sys

def solve():
    raw = sys.stdin.read().strip()
    if not raw: return
    n = int(raw)
    if n <= 2:
        print(n); return
    a, b = 1, 2
    for _ in range(3, n + 1):
        a, b = b, a + b
    print(b)

if __name__ == '__main__':
    solve()""",
            """#include <iostream>

int main() {
    int n;
    if (std::cin >> n) {
        if (n <= 2) { std::cout << n << std::endl; return 0; }
        int a = 1, b = 2;
        for (int i = 3; i <= n; ++i) {
            int c = a + b;
            a = b;
            b = c;
        }
        std::cout << b << std::endl;
    }
    return 0;
}""",
            """import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNextInt()) {
            int n = sc.nextInt();
            if (n <= 2) { System.out.println(n); return; }
            int a = 1, b = 2;
            for (int i = 3; i <= n; i++) {
                int c = a + b;
                a = b;
                b = c;
            }
            System.out.println(b);
        }
    }
}""",
            """const fs = require('fs');

function solve() {
    const raw = fs.readFileSync(0, 'utf-8').trim();
    if (!raw) return;
    const n = Number(raw);
    if (n <= 2) { console.log(n); return; }
    let a = 1, b = 2;
    for (let i = 3; i <= n; i++) {
        const c = a + b;
        a = b;
        b = c;
    }
    console.log(b);
}

solve();""",
            """import * as fs from 'fs';

function solve(): void {
    const raw = fs.readFileSync(0, 'utf-8').trim();
    if (!raw) return;
    const n = Number(raw);
    if (n <= 2) { console.log(n); return; }
    let a = 1, b = 2;
    for (let i = 3; i <= n; i++) {
        const c = a + b;
        a = b;
        b = c;
    }
    console.log(b);
}

solve();"""
        )
    ),

    # -------------------------------------------------------------------------
    # 9. OBJECT-ORIENTED PROGRAMMING (OOP)
    # -------------------------------------------------------------------------
    CodingProblem(
        id="oop-bank-account",
        title="Bank Account Class & Encapsulation",
        difficulty="Easy",
        category="Object-Oriented Programming (OOP)",
        description=(
            "Simulate a Bank Account with initial balance 0.\n"
            "Process a series of transactions from standard input:\n"
            "- `DEPOSIT <amount>`: adds amount to balance\n"
            "- `WITHDRAW <amount>`: subtracts amount if balance >= amount, otherwise ignores\n"
            "- `BALANCE`: prints current balance\n\n"
            "Each command is on a new line. Output the result of each `BALANCE` call."
        ),
        examples=[
            CodingProblemExample(input="DEPOSIT 100\nWITHDRAW 40\nBALANCE\nDEPOSIT 50\nBALANCE", output="60\n110"),
        ],
        constraints=["Amounts are positive integers."],
        hints=["Design a BankAccount class with deposit, withdraw, and get_balance methods."],
        test_cases=[
            CodingTestCase(input="DEPOSIT 100\nWITHDRAW 40\nBALANCE\nDEPOSIT 50\nBALANCE\n", expected_output="60\n110"),
            CodingTestCase(input="WITHDRAW 50\nBALANCE\nDEPOSIT 200\nBALANCE\n", expected_output="0\n200"),
        ],
        starter_code=_generate_starters(
            "bank_account",
            """import sys

class BankAccount:
    def __init__(self):
        self._balance = 0

    def deposit(self, amount: int):
        self._balance += amount

    def withdraw(self, amount: int):
        if self._balance >= amount:
            self._balance -= amount

    def get_balance(self) -> int:
        return self._balance

def main():
    account = BankAccount()
    for line in sys.stdin.read().strip().split('\\n'):
        parts = line.strip().split()
        if not parts: continue
        cmd = parts[0]
        if cmd == "DEPOSIT":
            account.deposit(int(parts[1]))
        elif cmd == "WITHDRAW":
            account.withdraw(int(parts[1]))
        elif cmd == "BALANCE":
            print(account.get_balance())

if __name__ == '__main__':
    main()""",
            """#include <iostream>
#include <string>

class BankAccount {
private:
    long long balance = 0;
public:
    void deposit(long long amount) { balance += amount; }
    void withdraw(long long amount) {
        if (balance >= amount) balance -= amount;
    }
    long long getBalance() const { return balance; }
};

int main() {
    BankAccount account;
    std::string cmd;
    while (std::cin >> cmd) {
        if (cmd == "DEPOSIT") {
            long long amt; std::cin >> amt;
            account.deposit(amt);
        } else if (cmd == "WITHDRAW") {
            long long amt; std::cin >> amt;
            account.withdraw(amt);
        } else if (cmd == "BALANCE") {
            std::cout << account.getBalance() << std::endl;
        }
    }
    return 0;
}""",
            """import java.util.Scanner;

class BankAccount {
    private long balance = 0;
    public void deposit(long amt) { balance += amt; }
    public void withdraw(long amt) {
        if (balance >= amt) balance -= amt;
    }
    public long getBalance() { return balance; }
}

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        BankAccount acc = new BankAccount();
        while (sc.hasNext()) {
            String cmd = sc.next();
            if (cmd.equals("DEPOSIT")) {
                acc.deposit(sc.nextLong());
            } else if (cmd.equals("WITHDRAW")) {
                acc.withdraw(sc.nextLong());
            } else if (cmd.equals("BALANCE")) {
                System.out.println(acc.getBalance());
            }
        }
    }
}""",
            """const fs = require('fs');

class BankAccount {
    constructor() { this.balance = 0; }
    deposit(amt) { this.balance += amt; }
    withdraw(amt) { if (this.balance >= amt) this.balance -= amt; }
    getBalance() { return this.balance; }
}

function solve() {
    const lines = fs.readFileSync(0, 'utf-8').trim().split('\\n');
    const acc = new BankAccount();
    for (const line of lines) {
        const parts = line.trim().split(/\\s+/);
        if (!parts[0]) continue;
        if (parts[0] === 'DEPOSIT') acc.deposit(Number(parts[1]));
        else if (parts[0] === 'WITHDRAW') acc.withdraw(Number(parts[1]));
        else if (parts[0] === 'BALANCE') console.log(acc.getBalance());
    }
}

solve();""",
            """import * as fs from 'fs';

class BankAccount {
    private balance: number = 0;
    deposit(amt: number): void { this.balance += amt; }
    withdraw(amt: number): void { if (this.balance >= amt) this.balance -= amt; }
    getBalance(): number { return this.balance; }
}

function solve(): void {
    const lines = fs.readFileSync(0, 'utf-8').trim().split('\\n');
    const acc = new BankAccount();
    for (const line of lines) {
        const parts = line.trim().split(/\\s+/);
        if (!parts[0]) continue;
        if (parts[0] === 'DEPOSIT') acc.deposit(Number(parts[1]));
        else if (parts[0] === 'WITHDRAW') acc.withdraw(Number(parts[1]));
        else if (parts[0] === 'BALANCE') console.log(acc.getBalance());
    }
}

solve();"""
        )
    ),

    # -------------------------------------------------------------------------
    # 10. RECURSION & BACKTRACKING
    # -------------------------------------------------------------------------
    CodingProblem(
        id="subsets-power-set",
        title="Subsets / Power Set Count",
        difficulty="Medium",
        category="Recursion",
        description=(
            "Given an integer array `nums` of unique elements, compute the total number of distinct subsets (the power set).\n"
            "For an array of length `n`, return `2^n`."
        ),
        examples=[
            CodingProblemExample(input="1 2 3", output="8", explanation="A 3-element set has 2^3 = 8 subsets."),
            CodingProblemExample(input="0", output="2"),
        ],
        constraints=["1 <= nums.length <= 30"],
        hints=["The number of subsets for a set with n elements is 2^n."],
        test_cases=[
            CodingTestCase(input="1 2 3\n", expected_output="8"),
            CodingTestCase(input="0\n", expected_output="2"),
            CodingTestCase(input="1 2 3 4\n", expected_output="16"),
        ],
        starter_code=_generate_starters(
            "subsets_count",
            """import sys

def solve():
    raw = sys.stdin.read().strip()
    if not raw: return
    nums = raw.split()
    print(2 ** len(nums))

if __name__ == '__main__':
    solve()""",
            """#include <iostream>
#include <vector>

int main() {
    int x;
    std::vector<int> nums;
    while (std::cin >> x) nums.push_back(x);
    long long ans = 1ULL << nums.size();
    std::cout << ans << std::endl;
    return 0;
}""",
            """import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int count = 0;
        while (sc.hasNextInt()) { sc.nextInt(); count++; }
        System.out.println(1L << count);
    }
}""",
            """const fs = require('fs');

function solve() {
    const raw = fs.readFileSync(0, 'utf-8').trim();
    if (!raw) return;
    const nums = raw.split(/\\s+/);
    console.log(2 ** nums.length);
}

solve();""",
            """import * as fs from 'fs';

function solve(): void {
    const raw = fs.readFileSync(0, 'utf-8').trim();
    if (!raw) return;
    const nums = raw.split(/\\s+/);
    console.log(2 ** nums.length);
}

solve();"""
        )
    ),

    # -------------------------------------------------------------------------
    # 11. BIT MANIPULATION
    # -------------------------------------------------------------------------
    CodingProblem(
        id="single-number",
        title="Single Number",
        difficulty="Easy",
        category="Bit Manipulation",
        description=(
            "Given a non-empty array of integers `nums`, every element appears twice except for one.\n"
            "Find that single one.\n"
            "Output the single integer."
        ),
        examples=[
            CodingProblemExample(input="2 2 1", output="1"),
            CodingProblemExample(input="4 1 2 1 2", output="4"),
            CodingProblemExample(input="1", output="1"),
        ],
        constraints=["1 <= nums.length <= 3 * 10^4"],
        hints=["Use the XOR operator `^`. A number XOR itself is 0, and a number XOR 0 is itself."],
        test_cases=[
            CodingTestCase(input="2 2 1\n", expected_output="1"),
            CodingTestCase(input="4 1 2 1 2\n", expected_output="4"),
            CodingTestCase(input="1\n", expected_output="1"),
        ],
        starter_code=_generate_starters(
            "single_number",
            """import sys

def solve():
    raw = sys.stdin.read().strip()
    if not raw: return
    nums = list(map(int, raw.split()))
    ans = 0
    for x in nums: ans ^= x
    print(ans)

if __name__ == '__main__':
    solve()""",
            """#include <iostream>

int main() {
    int x, ans = 0;
    while (std::cin >> x) ans ^= x;
    std::cout << ans << std::endl;
    return 0;
}""",
            """import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int ans = 0;
        while (sc.hasNextInt()) ans ^= sc.nextInt();
        System.out.println(ans);
    }
}""",
            """const fs = require('fs');

function solve() {
    const raw = fs.readFileSync(0, 'utf-8').trim();
    if (!raw) return;
    const nums = raw.split(/\\s+/).map(Number);
    let ans = 0;
    for (const x of nums) ans ^= x;
    console.log(ans);
}

solve();""",
            """import * as fs from 'fs';

function solve(): void {
    const raw = fs.readFileSync(0, 'utf-8').trim();
    if (!raw) return;
    const nums: number[] = raw.split(/\\s+/).map(Number);
    let ans = 0;
    for (const x of nums) ans ^= x;
    console.log(ans);
}

solve();"""
        )
    ),

    # -------------------------------------------------------------------------
    # 12. MATRICES & 2D ARRAYS
    # -------------------------------------------------------------------------
    CodingProblem(
        id="matrix-transpose",
        title="Matrix Transpose",
        difficulty="Easy",
        category="Matrices & 2D Arrays",
        description=(
            "Given a matrix represented as rows separated by newlines and elements separated by spaces,\n"
            "output the transposed matrix (rows become columns).\n\n"
            "Format:\n"
            "Line 1: rows count `R` and cols count `C`\n"
            "Following `R` lines: `C` integers each."
        ),
        examples=[
            CodingProblemExample(input="2 3\n1 2 3\n4 5 6", output="1 4\n2 5\n3 6"),
        ],
        constraints=["1 <= R, C <= 100"],
        hints=["The element at original row r and col c moves to row c and col r."],
        test_cases=[
            CodingTestCase(input="2 3\n1 2 3\n4 5 6\n", expected_output="1 4\n2 5\n3 6"),
            CodingTestCase(input="1 2\n7 8\n", expected_output="7\n8"),
        ],
        starter_code=_generate_starters(
            "matrix_transpose",
            """import sys

def solve():
    lines = sys.stdin.read().strip().split('\\n')
    if not lines or not lines[0]: return
    r, c = map(int, lines[0].split())
    mat = [list(map(int, lines[i + 1].split())) for i in range(r)]
    for j in range(c):
        row = [str(mat[i][j]) for i in range(r)]
        print(" ".join(row))

if __name__ == '__main__':
    solve()""",
            """#include <iostream>
#include <vector>

int main() {
    int r, c;
    if (std::cin >> r >> c) {
        std::vector<std::vector<int>> mat(r, std::vector<int>(c));
        for (int i = 0; i < r; ++i)
            for (int j = 0; j < c; ++j) std::cin >> mat[i][j];

        for (int j = 0; j < c; ++j) {
            for (int i = 0; i < r; ++i) {
                std::cout << mat[i][j];
                if (i + 1 < r) std::cout << " ";
            }
            std::cout << std::endl;
        }
    }
    return 0;
}""",
            """import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNextInt()) {
            int r = sc.nextInt(), c = sc.nextInt();
            int[][] mat = new int[r][c];
            for (int i = 0; i < r; i++)
                for (int j = 0; j < c; j++) mat[i][j] = sc.nextInt();

            for (int j = 0; j < c; j++) {
                StringBuilder sb = new StringBuilder();
                for (int i = 0; i < r; i++) {
                    sb.append(mat[i][j]);
                    if (i + 1 < r) sb.append(" ");
                }
                System.out.println(sb.toString());
            }
        }
    }
}""",
            """const fs = require('fs');

function solve() {
    const lines = fs.readFileSync(0, 'utf-8').trim().split('\\n');
    if (lines.length < 2) return;
    const [r, c] = lines[0].trim().split(/\\s+/).map(Number);
    const mat = [];
    for (let i = 0; i < r; i++) {
        mat.push(lines[i + 1].trim().split(/\\s+/).map(Number));
    }
    for (let j = 0; j < c; j++) {
        const row = [];
        for (let i = 0; i < r; i++) row.push(mat[i][j]);
        console.log(row.join(' '));
    }
}

solve();""",
            """import * as fs from 'fs';

function solve(): void {
    const lines = fs.readFileSync(0, 'utf-8').trim().split('\\n');
    if (lines.length < 2) return;
    const [r, c]: number[] = lines[0].trim().split(/\\s+/).map(Number);
    const mat: number[][] = [];
    for (let i = 0; i < r; i++) {
        mat.push(lines[i + 1].trim().split(/\\s+/).map(Number));
    }
    for (let j = 0; j < c; j++) {
        const row: number[] = [];
        for (let i = 0; i < r; i++) row.push(mat[i][j]);
        console.log(row.join(' '));
    }
}

solve();"""
        )
    ),

    # -------------------------------------------------------------------------
    # 13. LINKED LISTS & ADVANCED DATA STRUCTURES
    # -------------------------------------------------------------------------
    CodingProblem(
        id="reverse-linked-list",
        title="Reverse Sequence (Linked List Reversal Simulation)",
        difficulty="Easy",
        category="Linked Lists",
        description=(
            "Given a sequence of integers representing the node values of a singly-linked list from head to tail,\n"
            "reverse the sequence and output the values separated by space."
        ),
        examples=[
            CodingProblemExample(input="1 2 3 4 5", output="5 4 3 2 1"),
            CodingProblemExample(input="1 2", output="2 1"),
        ],
        constraints=["0 <= Node.val <= 5000", "0 <= length <= 5000"],
        hints=["Iterate through the elements and prepend or reverse in-place."],
        test_cases=[
            CodingTestCase(input="1 2 3 4 5\n", expected_output="5 4 3 2 1"),
            CodingTestCase(input="1 2\n", expected_output="2 1"),
            CodingTestCase(input="10\n", expected_output="10"),
        ],
        starter_code=_generate_starters(
            "reverse_list",
            """import sys

def solve():
    raw = sys.stdin.read().strip()
    if not raw: return
    nums = raw.split()
    print(" ".join(reversed(nums)))

if __name__ == '__main__':
    solve()""",
            """#include <iostream>
#include <vector>

int main() {
    int x;
    std::vector<int> nums;
    while (std::cin >> x) nums.push_back(x);
    for (int i = (int)nums.size() - 1; i >= 0; --i) {
        std::cout << nums[i];
        if (i > 0) std::cout << " ";
    }
    std::cout << std::endl;
    return 0;
}""",
            """import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        List<Integer> nums = new ArrayList<>();
        while (sc.hasNextInt()) nums.add(sc.nextInt());
        StringBuilder sb = new StringBuilder();
        for (int i = nums.size() - 1; i >= 0; i--) {
            sb.append(nums.get(i));
            if (i > 0) sb.append(" ");
        }
        System.out.println(sb.toString());
    }
}""",
            """const fs = require('fs');

function solve() {
    const raw = fs.readFileSync(0, 'utf-8').trim();
    if (!raw) return;
    const nums = raw.split(/\\s+/);
    console.log(nums.reverse().join(' '));
}

solve();""",
            """import * as fs from 'fs';

function solve(): void {
    const raw = fs.readFileSync(0, 'utf-8').trim();
    if (!raw) return;
    const nums: string[] = raw.split(/\\s+/);
    console.log(nums.reverse().join(' '));
}

solve();"""
        )
    ),

    # -------------------------------------------------------------------------
    # 14. TREES & BST
    # -------------------------------------------------------------------------
    CodingProblem(
        id="binary-tree-inorder",
        title="Tree Node Count and Height",
        difficulty="Medium",
        category="Trees & Binary Trees",
        description=(
            "Given the number of leaves `L` in a full and balanced binary tree,\n"
            "compute the minimum height of the tree (root is height 1)."
        ),
        examples=[
            CodingProblemExample(input="4", output="3", explanation="A balanced tree with 4 leaves has height log2(4)+1 = 2+1 = 3."),
            CodingProblemExample(input="1", output="1"),
        ],
        constraints=["1 <= L <= 10^9"],
        hints=["Height h is ceil(log2(L)) + 1."],
        test_cases=[
            CodingTestCase(input="4\n", expected_output="3"),
            CodingTestCase(input="1\n", expected_output="1"),
            CodingTestCase(input="8\n", expected_output="4"),
        ],
        starter_code=_generate_starters(
            "tree_height",
            """import sys
import math

def solve():
    raw = sys.stdin.read().strip()
    if not raw: return
    L = int(raw)
    if L <= 1:
        print(1); return
    print(math.ceil(math.log2(L)) + 1)

if __name__ == '__main__':
    solve()""",
            """#include <iostream>
#include <cmath>

int main() {
    long long L;
    if (std::cin >> L) {
        if (L <= 1) { std::cout << 1 << std::endl; return 0; }
        long long h = std::ceil(std::log2(L)) + 1;
        std::cout << h << std::endl;
    }
    return 0;
}""",
            """import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNextLong()) {
            long L = sc.nextLong();
            if (L <= 1) { System.out.println(1); return; }
            long h = (long)Math.ceil(Math.log(L) / Math.log(2)) + 1;
            System.out.println(h);
        }
    }
}""",
            """const fs = require('fs');

function solve() {
    const raw = fs.readFileSync(0, 'utf-8').trim();
    if (!raw) return;
    const L = Number(raw);
    if (L <= 1) { console.log(1); return; }
    console.log(Math.ceil(Math.log2(L)) + 1);
}

solve();""",
            """import * as fs from 'fs';

function solve(): void {
    const raw = fs.readFileSync(0, 'utf-8').trim();
    if (!raw) return;
    const L = Number(raw);
    if (L <= 1) { console.log(1); return; }
    console.log(Math.ceil(Math.log2(L)) + 1);
}

solve();"""
        )
    ),

    # -------------------------------------------------------------------------
    # 15. MIXED INTERVIEW PROBLEMS & EXCEPTION HANDLING
    # -------------------------------------------------------------------------
    CodingProblem(
        id="exception-handling-drill",
        title="Safe Division with Exception Handling",
        difficulty="Easy",
        category="Exception Handling",
        description=(
            "Read two integers `a` and `b` separated by space.\n"
            "Compute integer division `a // b`.\n"
            "If `b` is 0, catch the division by zero error and print `ERROR: Division by zero`.\n"
            "Otherwise, print the integer quotient."
        ),
        examples=[
            CodingProblemExample(input="10 2", output="5"),
            CodingProblemExample(input="10 0", output="ERROR: Division by zero"),
        ],
        constraints=["-10^9 <= a, b <= 10^9"],
        hints=["Use a try/catch or try/except block to catch division by zero."],
        test_cases=[
            CodingTestCase(input="10 2\n", expected_output="5"),
            CodingTestCase(input="10 0\n", expected_output="ERROR: Division by zero"),
            CodingTestCase(input="0 5\n", expected_output="0"),
        ],
        starter_code=_generate_starters(
            "safe_div",
            """import sys

def solve():
    raw = sys.stdin.read().strip()
    if not raw: return
    a, b = map(int, raw.split())
    try:
        if b == 0:
            raise ZeroDivisionError()
        print(a // b)
    except ZeroDivisionError:
        print("ERROR: Division by zero")

if __name__ == '__main__':
    solve()""",
            """#include <iostream>
#include <stdexcept>

int main() {
    long long a, b;
    if (std::cin >> a >> b) {
        try {
            if (b == 0) throw std::runtime_error("Division by zero");
            std::cout << (a / b) << std::endl;
        } catch (const std::exception& e) {
            std::cout << "ERROR: Division by zero" << std::endl;
        }
    }
    return 0;
}""",
            """import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNextLong()) {
            long a = sc.nextLong(), b = sc.nextLong();
            try {
                if (b == 0) throw new ArithmeticException("/ by zero");
                System.out.println(a / b);
            } catch (ArithmeticException e) {
                System.out.println("ERROR: Division by zero");
            }
        }
    }
}""",
            """const fs = require('fs');

function solve() {
    const raw = fs.readFileSync(0, 'utf-8').trim();
    if (!raw) return;
    const [a, b] = raw.split(/\\s+/).map(Number);
    try {
        if (b === 0) throw new Error("Division by zero");
        console.log(Math.floor(a / b));
    } catch (e) {
        console.log("ERROR: Division by zero");
    }
}

solve();""",
            """import * as fs from 'fs';

function solve(): void {
    const raw = fs.readFileSync(0, 'utf-8').trim();
    if (!raw) return;
    const [a, b]: number[] = raw.split(/\\s+/).map(Number);
    try {
        if (b === 0) throw new Error("Division by zero");
        console.log(Math.floor(a / b));
    } catch (e) {
        console.log("ERROR: Division by zero");
    }
}

solve();"""
        )
    ),

    CodingProblem(
        id="longest-common-prefix",
        title="Longest Common Prefix",
        difficulty="Easy",
        category="Strings",
        description=(
            "Write a function to find the longest common prefix string amongst an array of strings.\n"
            "Input is space-separated strings on a single line.\n"
            "If there is no common prefix, return an empty string (or empty line)."
        ),
        examples=[
            CodingProblemExample(input="flower flow flight", output="fl"),
            CodingProblemExample(input="dog racecar car", output=""),
        ],
        constraints=["1 <= strings.length <= 200"],
        hints=["Compare characters index by index across all strings until a mismatch occurs."],
        test_cases=[
            CodingTestCase(input="flower flow flight\n", expected_output="fl"),
            CodingTestCase(input="dog racecar car\n", expected_output=""),
            CodingTestCase(input="interspecies interstellar interstate\n", expected_output="inters"),
        ],
        starter_code=_generate_starters(
            "lcp",
            """import sys

def solve():
    raw = sys.stdin.read().strip()
    if not raw: return
    strs = raw.split()
    if not strs: return
    prefix = strs[0]
    for s in strs[1:]:
        while not s.startswith(prefix):
            prefix = prefix[:-1]
            if not prefix: break
    print(prefix)

if __name__ == '__main__':
    solve()""",
            """#include <iostream>
#include <vector>
#include <string>

int main() {
    std::string word;
    std::vector<std::string> strs;
    while (std::cin >> word) strs.push_back(word);
    if (strs.empty()) return 0;
    std::string prefix = strs[0];
    for (size_t i = 1; i < strs.size(); ++i) {
        while (strs[i].find(prefix) != 0) {
            prefix = prefix.substr(0, prefix.size() - 1);
            if (prefix.empty()) break;
        }
    }
    std::cout << prefix << std::endl;
    return 0;
}""",
            """import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        List<String> strs = new ArrayList<>();
        while (sc.hasNext()) strs.add(sc.next());
        if (strs.isEmpty()) return;
        String prefix = strs.get(0);
        for (int i = 1; i < strs.size(); i++) {
            while (strs.get(i).indexOf(prefix) != 0) {
                prefix = prefix.substring(0, prefix.length() - 1);
                if (prefix.isEmpty()) break;
            }
        }
        System.out.println(prefix);
    }
}""",
            """const fs = require('fs');

function solve() {
    const raw = fs.readFileSync(0, 'utf-8').trim();
    if (!raw) return;
    const strs = raw.split(/\\s+/);
    let prefix = strs[0] || '';
    for (let i = 1; i < strs.length; i++) {
        while (!strs[i].startsWith(prefix)) {
            prefix = prefix.slice(0, -1);
            if (!prefix) break;
        }
    }
    console.log(prefix);
}

solve();""",
            """import * as fs from 'fs';

function solve(): void {
    const raw = fs.readFileSync(0, 'utf-8').trim();
    if (!raw) return;
    const strs = raw.split(/\\s+/);
    let prefix: string = strs[0] || '';
    for (let i = 1; i < strs.length; i++) {
        while (!strs[i].startsWith(prefix)) {
            prefix = prefix.slice(0, -1);
            if (!prefix) break;
        }
    }
    console.log(prefix);
}

solve();"""
        )
    ),

    CodingProblem(
        id="move-zeroes",
        title="Move Zeroes to End",
        difficulty="Easy",
        category="Arrays",
        description=(
            "Given an integer array `nums`, move all 0's to the end of it while maintaining the relative order of the non-zero elements.\n"
            "Output the updated elements separated by space."
        ),
        examples=[
            CodingProblemExample(input="0 1 0 3 12", output="1 3 12 0 0"),
            CodingProblemExample(input="0", output="0"),
        ],
        constraints=["1 <= nums.length <= 10^4"],
        hints=["Keep track of the position of the next non-zero element with a pointer."],
        test_cases=[
            CodingTestCase(input="0 1 0 3 12\n", expected_output="1 3 12 0 0"),
            CodingTestCase(input="0\n", expected_output="0"),
            CodingTestCase(input="1 2 3\n", expected_output="1 2 3"),
        ],
        starter_code=_generate_starters(
            "move_zeroes",
            """import sys

def solve():
    raw = sys.stdin.read().strip()
    if not raw: return
    nums = list(map(int, raw.split()))
    non_zeros = [x for x in nums if x != 0]
    zeros = [0] * (len(nums) - len(non_zeros))
    print(" ".join(map(str, non_zeros + zeros)))

if __name__ == '__main__':
    solve()""",
            """#include <iostream>
#include <vector>

int main() {
    int x;
    std::vector<int> nums;
    while (std::cin >> x) nums.push_back(x);
    int insert_pos = 0;
    for (int num : nums) {
        if (num != 0) nums[insert_pos++] = num;
    }
    while (insert_pos < (int)nums.size()) nums[insert_pos++] = 0;
    for (size_t i = 0; i < nums.size(); ++i) {
        std::cout << nums[i];
        if (i + 1 < nums.size()) std::cout << " ";
    }
    std::cout << std::endl;
    return 0;
}""",
            """import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        List<Integer> nums = new ArrayList<>();
        while (sc.hasNextInt()) nums.add(sc.nextInt());
        List<Integer> nonZeros = new ArrayList<>();
        int zeros = 0;
        for (int x : nums) {
            if (x == 0) zeros++;
            else nonZeros.add(x);
        }
        for (int i = 0; i < zeros; i++) nonZeros.add(0);
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < nonZeros.size(); i++) {
            sb.append(nonZeros.get(i));
            if (i + 1 < nonZeros.size()) sb.append(" ");
        }
        System.out.println(sb.toString());
    }
}""",
            """const fs = require('fs');

function solve() {
    const raw = fs.readFileSync(0, 'utf-8').trim();
    if (!raw) return;
    const nums = raw.split(/\\s+/).map(Number);
    const nonZeros = nums.filter(x => x !== 0);
    const zeros = new Array(nums.length - nonZeros.length).fill(0);
    console.log([...nonZeros, ...zeros].join(' '));
}

solve();""",
            """import * as fs from 'fs';

function solve(): void {
    const raw = fs.readFileSync(0, 'utf-8').trim();
    if (!raw) return;
    const nums: number[] = raw.split(/\\s+/).map(Number);
    const nonZeros: number[] = nums.filter(x => x !== 0);
    const zeros: number[] = new Array(nums.length - nonZeros.length).fill(0);
    console.log([...nonZeros, ...zeros].join(' '));
}

solve();"""
        )
    ),
]


def get_all_problems() -> List[CodingProblem]:
    """Returns the full catalogue of coding problems."""
    return ALL_PROBLEMS


def get_problem_by_id(problem_id: str) -> Optional[CodingProblem]:
    """Finds a problem by unique identifier."""
    for p in ALL_PROBLEMS:
        if p.id == problem_id:
            return p
    return None


def get_all_topics() -> List[str]:
    """Returns all available topic category names."""
    return TOPIC_CATEGORIES


def filter_problems(
    category: Optional[str] = None,
    difficulty: Optional[str] = None,
    search: Optional[str] = None,
) -> List[CodingProblem]:
    """Filters problems by topic category, difficulty level, and search keyword."""
    results = ALL_PROBLEMS
    if category and category.lower() != "all topics" and category.lower() != "all":
        results = [p for p in results if p.category.lower() == category.lower()]
    if difficulty and difficulty.lower() != "all":
        results = [p for p in results if p.difficulty.lower() == difficulty.lower()]
    if search and search.strip():
        q = search.strip().lower()
        results = [p for p in results if q in p.title.lower() or q in p.description.lower() or q in p.category.lower()]
    return results
