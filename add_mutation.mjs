import fs from 'fs';

const file = fs.readFileSync('client/src/pages/BranchDetailView.tsx', 'utf-8');

const oldCode = `  const { user, isAuthenticated, loading } = useAuth();

  // Şubenin hedeflerini al
  const { data: branchTargets } = trpc.kpiTargetCards.getBranchTargets.useQuery(
    { period, branchName },
    { enabled: !!period && !!branchName }
  );`;

const newCode = `  const { user, isAuthenticated, loading } = useAuth();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");

  // Şubenin hedeflerini al
  const { data: branchTargets, refetch } = trpc.kpiTargetCards.getBranchTargets.useQuery(
    { period, branchName },
    { enabled: !!period && !!branchName }
  );

  // Gerçekleşen değer güncelleme mutation
  const updateActualValueMutation = trpc.kpiTargetCards.updateActualValue.useMutation({
    onSuccess: () => {
      refetch();
      setEditingId(null);
      setEditingValue("");
      toast.success("Değer başarıyla güncellendi");
    },
    onError: (error) => {
      toast.error(error.message || "Hata oluştu");
    },
  });`;

const newFile = file.replace(oldCode, newCode);
fs.writeFileSync('client/src/pages/BranchDetailView.tsx', newFile);
console.log('Mutation eklendi');
