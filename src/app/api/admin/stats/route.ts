import { NextResponse } from 'next/server';
import { dbQuery } from '@/lib/db';
import { isAdmin } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const isAuthorized = await isAdmin();
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Calculate Gross Revenue
    const revenueRes = await dbQuery(
      "SELECT SUM(total_amount) AS total FROM orders WHERE payment_status = 'SUCCESS'"
    );
    const grossRevenue = revenueRes && revenueRes[0].total ? parseFloat(revenueRes[0].total) : 0.00;

    // 2. Count Active Patrons
    const patronsRes = await dbQuery(
      "SELECT COUNT(id) AS count FROM users WHERE role = 'CUSTOMER'"
    );
    const activePatrons = patronsRes ? patronsRes[0].count : 0;

    // 3. Count Artworks Registered
    const productsRes = await dbQuery(
      "SELECT COUNT(id) AS count FROM products"
    );
    const totalArtworks = productsRes ? productsRes[0].count : 0;

    // 4. Calculate Fulfillment Rate
    const totalOrdersRes = await dbQuery("SELECT COUNT(id) AS count FROM orders");
    const totalOrders = totalOrdersRes ? totalOrdersRes[0].count : 0;

    const fulfilledOrdersRes = await dbQuery(
      "SELECT COUNT(id) AS count FROM orders WHERE status IN ('SHIPPED', 'DELIVERED')"
    );
    const fulfilledOrders = fulfilledOrdersRes ? fulfilledOrdersRes[0].count : 0;

    const fulfillmentRate = totalOrders > 0 
      ? parseFloat(((fulfilledOrders / totalOrders) * 100).toFixed(1)) 
      : 100.0;

    // 5. Query Sales Chart Data (Group by Month)
    const salesChartRes = await dbQuery(
      `SELECT 
        DATE_FORMAT(created_at, '%b') AS month,
        CAST(SUM(total_amount) AS DOUBLE) AS sales,
        COUNT(id) AS items
       FROM orders 
       WHERE payment_status = 'SUCCESS'
       GROUP BY month
       ORDER BY MIN(created_at)`
    );

    // 6. Fetch Recent Activity Logs
    const logsRes = await dbQuery(
      `SELECT action, details, created_at AS createdAt 
       FROM activity_logs 
       ORDER BY created_at DESC 
       LIMIT 5`
    );

    return NextResponse.json({
      stats: {
        grossRevenue,
        activePatrons,
        totalArtworks,
        fulfillmentRate,
      },
      chartData: salesChartRes || [],
      activityLogs: logsRes || [],
    });
  } catch (error: any) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard metrics' }, { status: 500 });
  }
}
