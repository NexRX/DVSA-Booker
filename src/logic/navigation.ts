/** Navigates to a DVSA page */
export function navigateTo(to: "login", openNew?: boolean) {
  const domain = "https://driverpracticaltest.dvsa.gov.uk";
  function navigate(path: string, target?: string) {
    if (openNew) {
      window.open(`${domain}${path}`, target);
    } else {
      window.location.href = `${domain}${path}`;
    }
  }
  switch (to) {
    case "login":
      return navigate("/login");
      break;
  }
}
