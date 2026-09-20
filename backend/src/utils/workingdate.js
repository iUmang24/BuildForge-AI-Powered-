exports.addWorkingDays = (startDate, workingDays) => {
  const date = new Date(startDate);
  let addedDays = 0;

  while (addedDays < workingDays) {
    date.setDate(date.getDate() + 1);

    const day = date.getDay();

    // Skip Saturday (6) & Sunday (0)
    if (day !== 0 && day !== 6) {
      addedDays++;
    }
  }

  return date;
};