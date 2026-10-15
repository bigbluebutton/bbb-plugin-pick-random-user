# Pick Random User Plugin – Automated Tests

End-to-end tests for the **Pick Random User Plugin** written with [Playwright](https://playwright.dev/).  
The test infrastructure lives entirely inside `tests/core/`.

---

## How the plugin is reached (BigBlueButton 4.0)

This branch targets BigBlueButton 4.0, which has no actions-button dropdown. The presenter
view is the plugin's **sidekick panel**, opened from the **apps gallery** in the navigation
sidebar; the modal only ever shows the picked user and opens by itself after a pick, for
presenter and viewers alike.

Consequences for the tests:

- `openPickRandomUserPanel()` (in `tests/behavioral/helpers.ts`) replaces the old
  "open the modal from the actions dropdown" helper. It is idempotent — the panel is a
  sidebar and stays open across tests in a suite.
- `closePickedUserModal()` replaces `goBackToPresenterView()`. The modal's "Close" button
  dismisses it; the panel behind it was never unmounted.
- The apps gallery entry is found through `apps_gallery_item_pickRandomUser`. The client
  builds that attribute from the `dataTest` passed to `GenericContentSidekickArea` in
  `src/components/extensible-areas/generic-content-sidekick-area/component.tsx`, so the
  suite never has to match on the translated panel name.

---

## Test scenarios

### Structural (`tests/structural/test.spec.ts`)

Verify that the plugin renders the correct elements with the correct labels and
initial state.

### Behavioural – single user (`tests/behavioral/single-user.spec.ts`)

Verify the pick-and-track workflow using only the moderator/presenter.

### Behavioural – multi-user (`tests/behavioral/multi-user.spec.ts`)

Verify real-time data-channel synchronization between the presenter and an
attendee in the same meeting.

---

## How to run the tests

### 1 – Install dependencies

From the **plugin root** (`plugin-pick-random-user/`):

```bash
npm install
npx playwright install --with-deps chromium
```

### 2 – Configure environment variables

```bash
cp .env.template .env
# edit .env and set BBB_URL and BBB_SECRET
```

| Variable | Required | Description |
|----------|----------|-------------|
| `BBB_URL` | **yes** | Full API URL, e.g. `https://bbb.example.com/bigbluebutton/` |
| `BBB_SECRET` | **yes** | Shared secret of the BBB server |
| `PICK_RANDOM_USER_PLUGIN_URL` | no | Direct URL to `manifest.json`; auto-detected from server otherwise |
| `LOCAL_CONTAINER_NAME` | no | Docker container name for the local deployment script |
| `TIMEOUT_MULTIPLIER` | no | Multiply all timeouts (default 1 locally, 2 in CI) |
| `CI` | no | `"true"` enables CI reporter and single-worker mode |
| `TEST_MEETINGS` | no | Set to `"isolated"` to give each test its own meeting (see [Meeting isolation](#meeting-isolation)) |

### 3 – Build and deploy the plugin

To build the plugin use the command:

```bash
npm run build-bundle
```

Then you need to deploy the plugin serve it so that the target BBB server can access it. You can deploy it to a S3-like environment or to your own server that you are targeting the test to. For the second option, we have a command to do that already:

```bash
npm run publish-plugin:dev
```

---

## Meeting isolation

By default every test suite (`test.describe` block) shares **one BBB meeting** for all its tests — the meeting is created once in `beforeAll` and torn down in `afterAll`. This is fast (~3 meetings total) but tests within a suite depend on the cleanup performed between them.

Setting `TEST_MEETINGS=isolated` switches every suite to **one meeting per test**: the meeting is created in `beforeEach` and destroyed in `afterEach`. Tests become fully independent and can run in parallel, at the cost of more meeting setups (~15 meetings total).

| Mode | Meetings created | Tests run | When to use |
|------|-----------------|-----------|-------------|
| default (`npm test`) | ~3 (one per suite) | serially within each suite | Normal development |
| isolated (`npm run test:isolated`) | ~1 per test | can run in parallel | Debugging flaky state, CI full isolation |

---

## Running the tests

```bash
# All suites – shared meetings (default)
npm test

# All suites – one meeting per test
npm run test:isolated

# Only structural tests
npm test -- tests/structural

# Only behavioural tests
npm test -- tests/behavioral

# Only multi-user behavioural tests
npm test -- tests/behavioral/multi-user

# A single test by name
npm test -- -g "should show the same picked user name"

# View the HTML report after a run
npx playwright show-report
```

---

## Test output

| Artifact | Location |
|----------|----------|
| HTML report | `playwright-report/index.html` |
| Traces | Attached to every test in the HTML report |
| Screenshots | Captured for every test |
| Video | Every test locally; failure-only in CI |
