import fs from 'fs';

const file = fs.readFileSync('client/src/pages/BranchDetailView.tsx', 'utf-8');

const oldCode = `                                <td className="p-2 text-center">{target.actualValue || "-"}</td>`;

const newCode = `                                <td className="p-2 text-center">
                                  {editingId === target.id && user?.role === "admin" ? (
                                    <div className="flex gap-1 justify-center">
                                      <input
                                        type="number"
                                        value={editingValue}
                                        onChange={(e) => setEditingValue(e.target.value)}
                                        className="w-16 px-2 py-1 border rounded text-xs"
                                        placeholder="Değer"
                                      />
                                      <button
                                        onClick={() => {
                                          if (editingValue) {
                                            updateActualValueMutation.mutate({
                                              id: target.id.toString(),
                                              actualValue: editingValue,
                                            });
                                          }
                                        }}
                                        className="px-2 py-1 bg-primary text-white text-xs rounded hover:bg-primary/90"
                                        disabled={updateActualValueMutation.isPending}
                                      >
                                        Kaydet
                                      </button>
                                      <button
                                        onClick={() => {
                                          setEditingId(null);
                                          setEditingValue("");
                                        }}
                                        className="px-2 py-1 bg-gray-300 text-xs rounded hover:bg-gray-400"
                                      >
                                        İptal
                                      </button>
                                    </div>
                                  ) : user?.role === "admin" ? (
                                    <span
                                      onClick={() => {
                                        setEditingId(target.id);
                                        setEditingValue(target.actualValue || "");
                                      }}
                                      className="cursor-pointer hover:bg-primary/10 px-2 py-1 rounded"
                                    >
                                      {target.actualValue || "-"}
                                    </span>
                                  ) : (
                                    <span>{target.actualValue || "-"}</span>
                                  )}
                                </td>`;

const newFile = file.replace(oldCode, newCode);
fs.writeFileSync('client/src/pages/BranchDetailView.tsx', newFile);
console.log('Input alanı eklendi');
