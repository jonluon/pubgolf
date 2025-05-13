const holes = [
    { id: "as", name: "A's", drink: "24oz beer", par: 3, emoji: "🍺" },
    { id: "pmans", name: "Pmans", drink: "Mimosas", par: 5, emoji: "🥂" },
    { id: "dogs", name: "Doggies", drink: "Iced Coffee", par: 2, emoji: "☕" },
    { id: "cafe", name: "Cafe", drink: "Pitcher", par: 6, emoji: "🍻" },
    { id: "pickles", name: "Pickles", drink: "Busch Pitcher", par: 6, emoji: "🍺" },
    { id: "bdubs", name: "Bdubs", drink: "Any tall beer", par: 2, emoji: "🍺" },
    { id: "phyrst", name: "Phyrst", drink: "Trashcan (BJ shot = -1)", par: 3, emoji: "🧪" },
    { id: "champs", name: "Champs", drink: "Dirty Sprite", par: 2, emoji: "🥤" },
    { id: "zenos", name: "Zenos", drink: "Irish Goodbye", par: 4, emoji: "🥃" }
  ];
  
  export default function HoleList({ scores }) {
    return (
      <div className="relative bg-white p-4 rounded-xl shadow border border-gray-200 mb-3 overflow-x-auto">
        <ul className="divide-y divide-gray-200 text-xs text-gray-800">
          {holes.map((hole, i) => {
            const isCompleted = scores?.[hole.id]?.sips !== undefined;
            return (
              <li
                key={hole.id}
                className={`flex justify-between py-1 px-1 ${
                  i % 2 === 0 ? "bg-white" : "bg-gray-50"
                } ${isCompleted ? "line-through text-gray-400" : ""}`}
              >
                <span className="w-1/3 truncate">{i + 1}. {hole.name}</span>
                <span className="w-1/3 text-center truncate">{hole.emoji} {hole.drink}</span>
                <span className="w-1/3 text-right text-gray-500">Par {hole.par}</span>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }
  