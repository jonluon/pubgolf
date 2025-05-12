export default function PlayerStats({ totalSips, parDiff, myRank, totalPlayers }) {
  const diffLabel =
    parDiff === 0
      ? "+0"
      : parDiff > 0
      ? `+${parDiff}`
      : `${parDiff}`;

  return (
    <div className="relative bg-white p-6 rounded-xl shadow border border-gray-200 mb-3">
      <div className="flex justify-center items-center space-x-2 text-gray-800">
        <span className="text-xl">🏆</span>
        <span className="text-lg font-medium">Ranked {myRank} out of {totalPlayers}</span>
      </div>
      <div className="flex justify-center items-center space-x-2 text-gray-800">
        <span className="text-xl">🏌️</span>
        <span className="text-lg font-medium">{totalSips}  Total Strokes ({diffLabel})</span>
      </div>
    </div>
  );
}
