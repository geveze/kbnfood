import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import mysql from "mysql2/promise";
import { z } from "zod";

export const positionsRouter = router({
  getAll: publicProcedure.query(async () => {
    try {
      const connection = await mysql.createConnection(process.env.DATABASE_URL!);
      const [positions] = await connection.execute(
        "SELECT id, name, display_name as displayName, description FROM positions ORDER BY display_name"
      );
      await connection.end();
      return positions as any[];
    } catch (error) {
      console.error("[Positions] Error fetching positions:", error);
      return [];
    }
  }),

  deletePosition: protectedProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Only admin can delete positions
      if (ctx.user.role !== 'admin') {
        throw new Error('Unauthorized');
      }

      try {
        const connection = await mysql.createConnection(process.env.DATABASE_URL!);
        const [result] = await connection.execute(
          "DELETE FROM positions WHERE name = ?",
          [input.name]
        );
        await connection.end();
        return { success: true, message: `Position '${input.name}' deleted successfully` };
      } catch (error) {
        console.error("[Positions] Error deleting position:", error);
        throw new Error('Failed to delete position');
      }
    }),
});
