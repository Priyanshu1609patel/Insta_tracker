const cron = require('node-cron');
const supabase = require('../supabase');
const { scrapeReelViews } = require('../scraper/instaScraper');

let isSyncing = false;

/**
 * Sync views for all active reels
 */
async function syncAllReelViews() {
  if (isSyncing) {
    console.log('[Sync] Previous sync still running, skipping...');
    return;
  }

  isSyncing = true;
  console.log(`[Sync] Starting view sync at ${new Date().toISOString()}`);

  try {
    // Get all active reels
    const { data: reels, error } = await supabase
      .from('reels')
      .select('id, reel_url, views')
      .eq('status', 'active')
      .order('last_updated', { ascending: true });

    if (error) throw error;
    if (!reels || reels.length === 0) {
      console.log('[Sync] No reels to sync');
      return;
    }

    console.log(`[Sync] Syncing ${reels.length} reels...`);
    let successCount = 0;
    let failCount = 0;

    for (const reel of reels) {
      try {
        const views = await scrapeReelViews(reel.reel_url);

        if (views !== null) {
          await supabase
            .from('reels')
            .update({ views, last_updated: new Date().toISOString() })
            .eq('id', reel.id);

          // Save to history
          await supabase.from('view_history').insert([{
            reel_id: reel.id,
            views
          }]);

          // Log success
          await supabase.from('sync_logs').insert([{
            reel_id: reel.id,
            status: 'success',
            message: 'Auto sync successful',
            views_before: reel.views,
            views_after: views
          }]);

          successCount++;
          console.log(`[Sync] ✓ ${reel.reel_url} → ${views} views`);
        } else {
          failCount++;

          await supabase.from('sync_logs').insert([{
            reel_id: reel.id,
            status: 'failed',
            message: 'Could not extract views',
            views_before: reel.views,
            views_after: null
          }]);

          console.log(`[Sync] ✗ Failed: ${reel.reel_url}`);
        }

        // Random delay between 3-6 seconds to avoid blocking
        await new Promise(r => setTimeout(r, 3000 + Math.random() * 3000));
      } catch (reelErr) {
        failCount++;
        console.error(`[Sync] Error for reel ${reel.id}:`, reelErr.message);
      }
    }

    console.log(`[Sync] Done. Success: ${successCount}, Failed: ${failCount}`);
  } catch (err) {
    console.error('[Sync] Fatal error:', err);
  } finally {
    isSyncing = false;
  }
}

/**
 * Start the background sync job
 * Default: every 3 hours
 */
function startSyncJob() {
  const hours = parseInt(process.env.SCRAPE_INTERVAL_HOURS || '3');
  const cronExpression = `0 */${hours} * * *`;

  console.log(`[Sync] Scheduling sync every ${hours} hour(s)`);

  cron.schedule(cronExpression, () => {
    syncAllReelViews();
  });

  // Run once on startup after 30 seconds
  setTimeout(() => {
    syncAllReelViews();
  }, 30000);
}

module.exports = { startSyncJob, syncAllReelViews };
