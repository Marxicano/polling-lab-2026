# November 2, 2026 — NYT/Siena old-vs-new weighting comparison

**Status:** Independent pre-election methodology note compiled after the November 2 v19 freeze. This is **not** an additional poll wave, a correction to observed margins, or a change to v19/v20 or the H1–H4 preregistered tests.

## Evidence source

- Nate Cohn, “The Final Polls Show a Blue Surge. Can We Trust Them?”, The New York Times, November 1, 2026. [Syndicated full text in The Philadelphia Inquirer, November 2](https://pmn-philly-media-network-prod.web.arc-cdn.net/politics/nation/midterm-election-polling-accuracy-20261102.html).
- [Siena Research Institute, November 1 seven-state original release](https://sri.siena.edu/2026/11/01/nytimes-siena-poll-of-likely-voters-alaska-iowa-kansas-maine-michigan-ohio-and-texas/).
- [Columbia Statistical Modeling blog, June 30: survey support scores and energy balancing](https://statmodeling.stat.columbia.edu/2026/06/30/survey-statistics-big-changes-in-the-times-siena-poll/).

## Same-survey methodological counterfactual (as explicitly reported by Nate Cohn)

| State | Old weighting D–R margin | Newly published D–R margin (Cohn's article) | New minus old, percentage points |
|---|---:|---:|---:|
| Michigan | +16 | +11 | -5 |
| Alaska | +6 | +1 | -5 |
| Iowa | +4 | +1 | -3 |
| Kansas | +10 | +5 | -5 |
| Maine | +5 | +6 | +1 |
| Ohio | +11 | +6 | -5 |
| Texas | +9 | +7 | -2 |
| **Arithmetic mean (equal state weight)** | **+8.71** | **+5.29** | **-3.43** |

**Do not append old-weighting results as new survey observations.** These are two post-processing methods applied to the same underlying respondents, thus seven dependent comparisons.

The independently published Siena rounded toplines give Alaska +2 (48–46) rather than Cohn's +1, and Ohio +5 (49–44) rather than Cohn's +6. This likely reflects separately rounded numbers or reporting conventions, **but that explanation has not been verified**; retain each source's stated margins with its own provenance.

## What the full article says

- In these seven states, registered **white** Democrats were about 30% more likely to answer NYT/Siena than registered **white** Republicans. This is a *relative response rate*, not the percentage of respondents who were Democrats.
- Cohn reports a similar 28% advantage in respondents from registered white Democrats in the 2022 final Times/Siena polls, which he describes as accurate. Nonresponse imbalance alone therefore does not identify the net polling error.
- Cohn attributes a possible midterm/presidential difference to turnout of Trump supporters and to weighting designed to compensate for differential response. However, even weights that match partisan groups cannot ensure that the *types* of people who responded within those groups are representative.
- The Times/Siena methodology changed in summer 2026. Contemporary methodology reporting describes synthetic 2024 vote, modeled 2024 support score and energy-balancing among the design elements. The posted seven-state arithmetic **does not identify the separate effect of any one component**.
- Cohn presents three interpretations: the new weighting may be appropriate; it might overcorrect in a midterm and understate Democrats; or nonresponse bias may still be sufficiently severe to understate Republicans.

## Prospective diagnostic (not a new registered H1–H4 test)

Compare old-weight and new-weight margins to official **certified** margins after the election. Calculate paired signed errors and paired absolute errors across the seven states, with each state one unit, clearly acknowledging common pollster and shared-election correlations. Report directional patterns as **descriptive, exploratory** findings, not calibrated statewide or national error estimates.

**Never** add +3.43 to all polls or state averages. This is a method-specific difference within one pollster's seven-state wave, not a measured accuracy error and not evidence of a universal correction.

GitHub's commit timestamp establishes when this note was publicly posted; the original article was published before the election. Neither changes the earlier v19 snapshot or v20 preregistration.
