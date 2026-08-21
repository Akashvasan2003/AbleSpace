export default async function run(page, ui) {
  // Wait for guest button
  await page.waitForSelector('button');
  const snapshot = await ui.snapshot();
  
  // Find guest button
  const guestBtn = snapshot.match(/@(e\d+) button "Continue as Guest"/)?.[1];
  if (guestBtn) {
    await ui.click(guestBtn);
  } else {
    // Click button directly
    await page.click('button:has-text("Continue as Guest")');
  }
  
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'dashboard.png' });

  // Navigate to projects
  await page.goto('https://frontend-sepia-delta-p7x6mrrj9q.vercel.app/dashboard/projects');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'projects.png' });

  // Navigate to tasks
  await page.goto('https://frontend-sepia-delta-p7x6mrrj9q.vercel.app/dashboard/tasks');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'tasks.png' });

  return { success: true };
}
