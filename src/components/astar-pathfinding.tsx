import React, { useState, useEffect, useCallback } from 'react';

// Node 타입 정의
interface NodeType {
  row: number;
  col: number;
  isStart: boolean;
  isEnd: boolean;
  distance: number;
  isVisited: boolean;
  isWall: boolean;
  isPath: boolean;
  previousNode: [number, number] | null;
  fScore: number;
  gScore: number;
  hScore: number;
}

// 그리드 노드 컴포넌트 Props 타입 정의
interface NodeProps {
  row: number;
  col: number;
  isStart: boolean;
  isEnd: boolean;
  isWall: boolean;
  isVisited: boolean;
  isPath: boolean;
  onMouseDown: (row: number, col: number) => void;
  onMouseEnter: (row: number, col: number) => void;
  onMouseUp: () => void;
}

// 그리드 노드 컴포넌트
const Node: React.FC<NodeProps> = ({ 
  row, col, isStart, isEnd, isWall, isVisited, isPath, onMouseDown, onMouseEnter, onMouseUp 
}) => {
  const extraClassName = isStart
    ? 'bg-green-500'
    : isEnd
    ? 'bg-red-500'
    : isWall
    ? 'bg-gray-800'
    : isPath
    ? 'bg-yellow-400'
    : isVisited
    ? 'bg-blue-300'
    : 'bg-white';

  return (
    <div
      className={`border border-gray-300 w-6 h-6 ${extraClassName} transition-colors duration-200`}
      onMouseDown={() => onMouseDown(row, col)}
      onMouseEnter={() => onMouseEnter(row, col)}
      onMouseUp={() => onMouseUp()}
    />
  );
};

const AStarPathfinding: React.FC = () => {
  const [grid, setGrid] = useState<NodeType[][]>([]);
  const [startNode, setStartNode] = useState({ row: 5, col: 5 });
  const [endNode, setEndNode] = useState({ row: 15, col: 35 });
  const [mouseIsPressed, setMouseIsPressed] = useState(false);
  const [currentMode, setCurrentMode] = useState('wall'); // 'wall', 'start', 'end'
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(10); // 애니메이션 속도 (밀리초 단위)
  const [pathFound, setPathFound] = useState(false);

  const ROWS = 20;
  const COLS = 40;

  // 노드 생성 함수
  const createNode = (row: number, col: number): NodeType => {
    return {
      row,
      col,
      isStart: row === startNode.row && col === startNode.col,
      isEnd: row === endNode.row && col === endNode.col,
      distance: Infinity,
      isVisited: false,
      isWall: false,
      isPath: false,
      previousNode: null,
      fScore: Infinity, // f(n) = g(n) + h(n)
      gScore: Infinity, // g(n): 시작 노드로부터의 비용
      hScore: 0, // h(n): 목표 노드까지의 휴리스틱 추정 비용
    };
  };

  // 빈 그리드 초기화 함수
  const initializeGrid = useCallback(() => {
    const newGrid: NodeType[][] = [];
    for (let row = 0; row < ROWS; row++) {
      const currentRow: NodeType[] = [];
      for (let col = 0; col < COLS; col++) {
        currentRow.push(createNode(row, col));
      }
      newGrid.push(currentRow);
    }
    return newGrid;
  }, [startNode.row, startNode.col, endNode.row, endNode.col]);

  // 컴포넌트 마운트 시 그리드 초기화
  useEffect(() => {
    const initialGrid = initializeGrid();
    setGrid(initialGrid);
  }, [initializeGrid]);

  // 그리드 초기화 버튼 핸들러
  const resetGrid = (): void => {
    setIsRunning(false);
    setPathFound(false);
    setGrid(initializeGrid());
  };

  // 방문 노드 초기화 버튼 핸들러
  const clearVisitedNodes = (): void => {
    setIsRunning(false);
    setPathFound(false);
    setGrid(grid => {
      const newGrid = grid.slice();
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          const node = newGrid[row][col];
          if (node.isVisited || node.isPath) {
            newGrid[row][col] = {
              ...node,
              isVisited: false,
              isPath: false,
              distance: Infinity,
              previousNode: null,
              fScore: Infinity,
              gScore: Infinity,
            };
          }
        }
      }
      return newGrid;
    });
  };

  // 마우스 다운 핸들러
  const handleMouseDown = (row: number, col: number): void => {
    if (isRunning) return;
    setMouseIsPressed(true);
    
    if (currentMode === 'wall') {
      const newGrid = toggleWall(grid, row, col);
      setGrid(newGrid);
    } else if (currentMode === 'start') {
      const newGrid = setNewStartNode(grid, row, col, startNode);
      setGrid(newGrid);
      setStartNode({ row, col });
    } else if (currentMode === 'end') {
      const newGrid = setNewEndNode(grid, row, col, endNode);
      setGrid(newGrid);
      setEndNode({ row, col });
    }
  };

  // 마우스 엔터 핸들러
  const handleMouseEnter = (row: number, col: number): void => {
    if (!mouseIsPressed || isRunning) return;
    
    if (currentMode === 'wall') {
      const newGrid = toggleWall(grid, row, col);
      setGrid(newGrid);
    }
  };

  // 마우스 업 핸들러
  const handleMouseUp = (): void => {
    setMouseIsPressed(false);
  };

  // 벽 토글 함수
  const toggleWall = (grid: NodeType[][], row: number, col: number): NodeType[][] => {
    const newGrid = grid.slice();
    const node = newGrid[row][col];
    if (!node.isStart && !node.isEnd) {
      const newNode = {
        ...node,
        isWall: !node.isWall,
      };
      newGrid[row][col] = newNode;
    }
    return newGrid;
  };

  // 시작 노드 설정 함수
  const setNewStartNode = (grid: NodeType[][], row: number, col: number, oldStartNode: {row: number, col: number}): NodeType[][] => {
    const newGrid = grid.slice();
    // 이전 시작 노드 초기화
    newGrid[oldStartNode.row][oldStartNode.col] = {
      ...newGrid[oldStartNode.row][oldStartNode.col],
      isStart: false,
    };
    // 새 시작 노드 설정
    if (!newGrid[row][col].isEnd && !newGrid[row][col].isWall) {
      newGrid[row][col] = {
        ...newGrid[row][col],
        isStart: true,
      };
    }
    return newGrid;
  };

  // 끝 노드 설정 함수
  const setNewEndNode = (grid: NodeType[][], row: number, col: number, oldEndNode: {row: number, col: number}): NodeType[][] => {
    const newGrid = grid.slice();
    // 이전 끝 노드 초기화
    newGrid[oldEndNode.row][oldEndNode.col] = {
      ...newGrid[oldEndNode.row][oldEndNode.col],
      isEnd: false,
    };
    // 새 끝 노드 설정
    if (!newGrid[row][col].isStart && !newGrid[row][col].isWall) {
      newGrid[row][col] = {
        ...newGrid[row][col],
        isEnd: true,
      };
    }
    return newGrid;
  };

  // 맨해튼 거리 계산 함수 (휴리스틱)
  const manhattanDistance = (row1: number, col1: number, row2: number, col2: number): number => {
    return Math.abs(row1 - row2) + Math.abs(col1 - col2);
  };

  // A* 알고리즘 실행 함수
  const visualizeAStar = (): void => {
    if (isRunning) return;
    clearVisitedNodes();
    setIsRunning(true);
    setPathFound(false);
    
    const startRow = startNode.row;
    const startCol = startNode.col;
    const endRow = endNode.row;
    const endCol = endNode.col;
    
    const openSet: [number, number][] = [];
    const closedSet: [number, number][] = [];
    const visitedNodesInOrder: [number, number][] = [];
    
    // 그리드 초기화 및 시작 노드 설정
    const newGrid = grid.slice();
    newGrid[startRow][startCol] = {
      ...newGrid[startRow][startCol],
      gScore: 0,
      fScore: manhattanDistance(startRow, startCol, endRow, endCol),
    };
    
    openSet.push([startRow, startCol]);
    
    // A* 알고리즘 실행
    function runAStar() {
      if (openSet.length === 0) {
        setIsRunning(false);
        setTimeout(() => {
          alert('경로를 찾을 수 없습니다!');
        }, 100);
        return false;
      }
      
      // fScore가 가장 낮은 노드 찾기
      let lowestIndex = 0;
      for (let i = 0; i < openSet.length; i++) {
        const [row, col] = openSet[i];
        const [lowestRow, lowestCol] = openSet[lowestIndex];
        if (newGrid[row][col].fScore < newGrid[lowestRow][lowestCol].fScore) {
          lowestIndex = i;
        }
      }
      
      const [currentRow, currentCol] = openSet[lowestIndex];
      
      // 목표 도달 체크
      if (currentRow === endRow && currentCol === endCol) {
        const nodesInShortestPathOrder = getNodesInShortestPathOrder(newGrid[endRow][endCol]);
        animateShortestPath(nodesInShortestPathOrder);
        setIsRunning(false);
        setPathFound(true);
        return true;
      }
      
      // 현재 노드 openSet에서 제거, closedSet에 추가
      openSet.splice(lowestIndex, 1);
      closedSet.push([currentRow, currentCol]);
      
      // 방문한 노드 기록
      if (!newGrid[currentRow][currentCol].isStart && !newGrid[currentRow][currentCol].isEnd) {
        visitedNodesInOrder.push([currentRow, currentCol]);
      }
      
      // 이웃 노드 탐색
      const neighbors = getNeighbors(newGrid, currentRow, currentCol);
      for (const [neighborRow, neighborCol] of neighbors) {
        // 이미 확인한 노드거나 벽이면 건너뛰기
        if (closedSetIncludes(closedSet, neighborRow, neighborCol) || 
            newGrid[neighborRow][neighborCol].isWall) {
          continue;
        }
        
        const tentativeGScore = newGrid[currentRow][currentCol].gScore + 1;
        const neighborInOpenSet = openSetIncludes(openSet, neighborRow, neighborCol);
        
        if (!neighborInOpenSet || tentativeGScore < newGrid[neighborRow][neighborCol].gScore) {
          // 이웃 노드 업데이트
          const hScore = manhattanDistance(neighborRow, neighborCol, endRow, endCol);
          
          newGrid[neighborRow][neighborCol] = {
            ...newGrid[neighborRow][neighborCol],
            previousNode: [currentRow, currentCol],
            gScore: tentativeGScore,
            fScore: tentativeGScore + hScore,
          };
          
          if (!neighborInOpenSet) {
            openSet.push([neighborRow, neighborCol]);
          }
        }
      }
      
      // 다음 프레임에서 계속 실행
      return false;
    }
    
    // 애니메이션 함수
    function animateAStar() {
      setGrid(newGrid);
      const done = runAStar();
      
      if (!done && openSet.length > 0) {
        setTimeout(() => {
          // 방문한 노드 업데이트
          const updatedGrid = newGrid.slice();
          for (const [row, col] of visitedNodesInOrder) {
            if (!updatedGrid[row][col].isStart && !updatedGrid[row][col].isEnd) {
              updatedGrid[row][col] = {
                ...updatedGrid[row][col],
                isVisited: true,
              };
            }
          }
          setGrid(updatedGrid);
          
          // 다음 애니메이션 프레임 예약
          animateAStar();
        }, speed);
      }
    }
    
    // 최단 경로 애니메이션 함수
    function animateShortestPath(nodesInShortestPathOrder: [number, number][]) {
      for (let i = 0; i < nodesInShortestPathOrder.length; i++) {
        setTimeout(() => {
          const [row, col] = nodesInShortestPathOrder[i];
          setGrid(prevGrid => {
            const newGrid = prevGrid.slice();
            if (!newGrid[row][col].isStart && !newGrid[row][col].isEnd) {
              newGrid[row][col] = {
                ...newGrid[row][col],
                isPath: true,
              };
            }
            return newGrid;
          });
        }, 50 * i);
      }
    }
    
    // 애니메이션 시작
    animateAStar();
  };

  // 최단 경로 노드 순서 가져오기 함수
  const getNodesInShortestPathOrder = (endNode: NodeType): [number, number][] => {
    const nodesInShortestPathOrder: [number, number][] = [];
    let currentNode = endNode;
    
    while (currentNode.previousNode) {
      const [row, col] = currentNode.previousNode;
      nodesInShortestPathOrder.unshift([row, col]);
      currentNode = grid[row][col];
    }
    
    return nodesInShortestPathOrder;
  };

  // 이웃 노드 가져오기 함수
  const getNeighbors = (grid: NodeType[][], row: number, col: number): [number, number][] => {
    const neighbors: [number, number][] = [];
    if (row > 0) neighbors.push([row - 1, col]); // 위
    if (row < ROWS - 1) neighbors.push([row + 1, col]); // 아래
    if (col > 0) neighbors.push([row, col - 1]); // 왼쪽
    if (col < COLS - 1) neighbors.push([row, col + 1]); // 오른쪽
    return neighbors;
  };

  // openSet에 노드가 있는지 확인하는 함수
  const openSetIncludes = (openSet: [number, number][], row: number, col: number): boolean => {
    return openSet.some(([r, c]) => r === row && c === col);
  };

  // closedSet에 노드가 있는지 확인하는 함수
  const closedSetIncludes = (closedSet: [number, number][], row: number, col: number): boolean => {
    return closedSet.some(([r, c]) => r === row && c === col);
  };

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">A* 알고리즘 경로 탐색 시뮬레이션</h1>
      
      <div className="mb-4 flex gap-2 flex-wrap">
        <button
          className={`px-3 py-2 rounded ${currentMode === 'wall' ? 'bg-blue-600 text-white' : 'bg-blue-200'}`}
          onClick={() => setCurrentMode('wall')}
          disabled={isRunning}
        >
          벽 그리기
        </button>
        <button
          className={`px-3 py-2 rounded ${currentMode === 'start' ? 'bg-green-600 text-white' : 'bg-green-200'}`}
          onClick={() => setCurrentMode('start')}
          disabled={isRunning}
        >
          시작점 이동
        </button>
        <button
          className={`px-3 py-2 rounded ${currentMode === 'end' ? 'bg-red-600 text-white' : 'bg-red-200'}`}
          onClick={() => setCurrentMode('end')}
          disabled={isRunning}
        >
          끝점 이동
        </button>
        <button
          className="px-3 py-2 rounded bg-yellow-500 text-white"
          onClick={visualizeAStar}
          disabled={isRunning}
        >
          A* 알고리즘 시작
        </button>
        <button
          className="px-3 py-2 rounded bg-gray-500 text-white"
          onClick={clearVisitedNodes}
          disabled={isRunning}
        >
          방문 노드 초기화
        </button>
        <button
          className="px-3 py-2 rounded bg-gray-700 text-white"
          onClick={resetGrid}
          disabled={isRunning}
        >
          전체 초기화
        </button>
      </div>

      <div className="mb-4">
        <label className="block mb-2">애니메이션 속도: {speed}ms</label>
        <input
          type="range"
          min="1"
          max="100"
          value={speed}
          onChange={(e) => setSpeed(parseInt(e.target.value))}
          className="w-64"
          disabled={isRunning}
        />
      </div>

      <div className="mb-4 flex gap-4">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-500 mr-2"></div>
          <span>시작점</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-500 mr-2"></div>
          <span>끝점</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-gray-800 mr-2"></div>
          <span>벽</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-blue-300 mr-2"></div>
          <span>방문한 노드</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-yellow-400 mr-2"></div>
          <span>최단 경로</span>
        </div>
      </div>

      <div className="inline-block border border-gray-400">
        {grid.map((row, rowIdx) => (
          <div key={rowIdx} className="flex">
            {row.map((node, nodeIdx) => (
              <Node
                key={nodeIdx}
                row={node.row}
                col={node.col}
                isStart={node.isStart}
                isEnd={node.isEnd}
                isWall={node.isWall}
                isVisited={node.isVisited}
                isPath={node.isPath}
                onMouseDown={handleMouseDown}
                onMouseEnter={handleMouseEnter}
                onMouseUp={handleMouseUp}
              />
            ))}
          </div>
        ))}
      </div>

      {pathFound && (
        <div className="mt-4 p-3 bg-green-100 border border-green-400 rounded">
          경로를 찾았습니다!
        </div>
      )}

      <div className="mt-6 p-4 bg-white rounded shadow text-left">
        <h2 className="text-xl font-semibold mb-2">A* 알고리즘 설명</h2>
        <p className="mb-2 text-left">
          A* 알고리즘은 그래프 탐색 알고리즘으로, 시작 노드에서 목표 노드까지의 최단 경로를 찾기 위해 사용됩니다.
          다익스트라 알고리즘의 확장으로, 휴리스틱 함수를 사용하여 탐색 방향을 목표 쪽으로 유도합니다.
        </p>
        <p className="mb-2 text-left">
          A* 알고리즘은 다음 수식을 사용합니다: <strong>f(n) = g(n) + h(n)</strong>
        </p>
        <ul className="list-disc pl-5 mb-2 text-left">
          <li><strong>f(n)</strong>: 노드의 총 비용</li>
          <li><strong>g(n)</strong>: 시작 노드에서 현재 노드까지의 실제 비용</li>
          <li><strong>h(n)</strong>: 현재 노드에서 목표 노드까지의 추정 비용 (휴리스틱)</li>
        </ul>
        <p className="text-left">
          이 시뮬레이션에서는 맨해튼 거리(Manhattan distance)를 휴리스틱으로 사용합니다. 맨해튼 거리는 
          두 점 사이의 수평 및 수직 이동 거리의 합으로, 그리드 기반 경로 탐색에 적합합니다.
        </p>
      </div>
    </div>
  );
};

export default AStarPathfinding;