// Seeded sample docket. All parties and handles are fictional.
// kind "record": the outcome is documented in the case file, revealed after you rule.
// kind "jury":   the outcome is the simulated jury's majority (crowd = % voting guilty).
// A ruling is "accurate" when it matches the outcome.
window.CASES = [
  {
    id: "c01", category: "DeFi", kind: "record", outcome: "not guilty",
    title: "The Floor Price Heist",
    charge: "Wallet sweepy.eth is accused of dumping and crashing a collection's floor by 40% in one hour.",
    facts: "Floor fell from 12 to 7.2 MON between 14:00 and 15:00. Wallet sweepy.eth was the top seller by volume that hour.",
    exhibitA: "Prosecution: sweepy.eth sold during the exact window of the crash, and was the largest seller.",
    exhibitB: "Defense: sweepy.eth sold only 2 items, both at the existing floor, and listed nothing below it.",
    bench: { Judge: "Procedure: 'largest seller' is not 'cause of the drop'. Check who listed below floor.", Prosecutor: "Your file: 31 listings were posted below floor by 9 other wallets before the sales.", Defender: "Your file: the 2 sales were filled at asking price. No price was undercut.", Witness: "You saw it: a bot delisted and relisted 31 items at 7 MON. sweepy.eth just sold into it." },
    instinct: "Bench instinct: a seller who matches the floor does not move it.",
    note: "Record: 31 below-floor listings from a market-making bot started the slide. sweepy.eth's two sales were at floor."
  },
  {
    id: "c02", category: "Predictions", kind: "record", outcome: "guilty",
    title: "The 10x By Friday Claim",
    charge: "User moonlit_88 is accused of making a false prediction: 'this coin will 10x by Friday.'",
    facts: "The post was made Monday at 9.00 with the coin at 0.004. Friday close was 0.0052.",
    exhibitA: "Prosecution: 0.0052 is a 1.3x move. The claim said 10x. The deadline passed.",
    exhibitB: "Defense: the coin touched 0.011 on Thursday, which is 2.75x, and 'by Friday' could include intraday highs.",
    bench: { Judge: "Procedure: a prediction is judged on its stated terms, which were a 10x by Friday.", Prosecutor: "Your file: no point in the week came within 3x of a 10x.", Defender: "Your file: your best argument is the Thursday spike. It is still a quarter of what was claimed.", Witness: "You saw it: the Thursday spike lasted 11 minutes and was one thin order." },
    instinct: "Bench instinct: 'almost' is not a defense when the number was 10.",
    note: "Record: peak was 2.75x, close was 1.3x. The claim was off by an order of magnitude."
  },
  {
    id: "c03", category: "Memes", kind: "jury", crowd: 78,
    title: "The Great Pineapple Pizza Profile Picture",
    charge: "A collector is accused of replacing a legendary rare with a pineapple-pizza image 'as a joke' and refusing to explain.",
    facts: "The collector owns a top-20 rarity. Their avatar was changed Sunday. Their bio now reads only: 'trust the process'.",
    exhibitA: "Prosecution: the holder is the face of a community of 400 owners. Silence about a pizza is a choice.",
    exhibitB: "Defense: it is their own avatar and their own Sunday. Nobody was harmed by toppings.",
    bench: { Judge: "Procedure: the charge is conduct unbecoming. There is no rule about toppings.", Prosecutor: "Your file: 'trust the process' appears on 3 of their previous 4 bad ideas.", Defender: "Your file: they did explain once, privately, to two members, and it was funny.", Witness: "You saw it: the pizza is on the rarest Chog trait background. It is deliberate." },
    instinct: "Bench instinct: juries punish silence more than pineapple.",
    note: "The jury sided with the prosecution. The pizza stood but the silence did not."
  },
  {
    id: "c04", category: "Drama", kind: "record", outcome: "not guilty",
    title: "The Screenshot That Was Cropped",
    charge: "Account vaultwatcher is accused of posting a doctored screenshot to smear a project's founder.",
    facts: "The screenshot shows the founder writing 'we will never ship this'. A thread claims it was edited.",
    exhibitA: "Prosecution: the full chat has a line before it that changes the meaning.",
    exhibitB: "Defense: the screenshot was cropped by the app's own share sheet, not by hand.",
    bench: { Judge: "Procedure: cropped is not doctored unless pixels were changed. Check the metadata.", Prosecutor: "Your file: the missing line was 'if the audit fails, we will never ship this'.", Defender: "Your file: the original file has no edits. The crop matches the share-sheet template exactly.", Witness: "You saw it: three other accounts posted the same crop within a minute. It was the app." },
    instinct: "Bench instinct: ask whether any pixel changed, not whether the story did.",
    note: "Record: the file hash matched the share-sheet output. Cropped by the app, no manual edit."
  },
  {
    id: "c05", category: "Tech", kind: "record", outcome: "guilty",
    title: "The Airdrop Checker That Wasn't",
    charge: "The site claim-your-drop.example is accused of running a fake eligibility checker to collect wallet approvals.",
    facts: "The site asks users to 'verify' by approving a token spend. It uses the project's logo and a similar name.",
    exhibitA: "Prosecution: the approval is unlimited and goes to an address with no link to the project.",
    exhibitB: "Defense: the owner says the approval is a 'standard verification' and that it never moved funds.",
    bench: { Judge: "Procedure: intent matters, but an unlimited approval to an unrelated address is the usual tool.", Prosecutor: "Your file: the same address received approvals from 212 wallets in a day.", Defender: "Your file: the owner has no explanation for why verification needs spending rights.", Witness: "You saw it: the project's official account warned about the domain two hours earlier." },
    instinct: "Bench instinct: nobody needs spend rights to check a list.",
    note: "Record: the approval address drained 14 wallets that evening."
  },
  {
    id: "c06", category: "Memes", kind: "jury", crowd: 34,
    title: "The Unauthorized Remix",
    charge: "An artist is accused of remixing the community mascot into a video without permission.",
    facts: "The 40-second video went viral. The mascot's art is community-owned. The artist did not ask first.",
    exhibitA: "Prosecution: the community's own guide says to ask before using the art commercially.",
    exhibitB: "Defense: the video earns nothing and brought thousands of new people in.",
    bench: { Judge: "Procedure: the guide says 'commercially'. The video has no ads, tips or sponsors.", Prosecutor: "Your file: a link to a paid course appears in the artist's profile.", Defender: "Your file: the course link was added three weeks before the video.", Witness: "You saw it: the artist credited the community in the first frame." },
    instinct: "Bench instinct: the rule says commercial. Nothing here was sold.",
    note: "The jury declined to convict. The artist later added a thank-you pinned to the video."
  },
  {
    id: "c07", category: "DeFi", kind: "record", outcome: "guilty",
    title: "The Rounding Error That Rounded Upward",
    charge: "A vault contract is accused of rounding in the operator's favor on every withdrawal.",
    facts: "Withdrawals show a shortfall of a fraction of a cent each. Across 8,000 withdrawals it adds up.",
    exhibitA: "Prosecution: the shortfall is always positive for the operator, never negative.",
    exhibitB: "Defense: integer math rounds down. It is a known limitation, not theft.",
    bench: { Judge: "Procedure: rounding that is always one-directional is a design choice, not noise.", Prosecutor: "Your file: 8,000 samples, zero rounded the other way. Random rounding would split near half.", Defender: "Your file: the docs mention rounding but not direction.", Witness: "You saw it: the fee wallet received exactly the missing amount." },
    instinct: "Bench instinct: random noise goes both ways.",
    note: "Record: the contract was patched to round in the user's favor after the audit."
  },
  {
    id: "c08", category: "Drama", kind: "jury", crowd: 61,
    title: "The Delayed Roadmap",
    charge: "A project lead is accused of misleading holders by saying 'two weeks' for the fourth time.",
    facts: "Four 'two weeks' announcements across five months. Code commits continue weekly. No launch yet.",
    exhibitA: "Prosecution: a deadline repeated four times with no result is a habit, not an estimate.",
    exhibitB: "Defense: the team is small, the scope grew, and every update came with working screenshots.",
    bench: { Judge: "Procedure: the question is honesty, not speed. Were the dates believed when said?", Prosecutor: "Your file: two of the four dates were announced the day after missing the previous one.", Defender: "Your file: the scope grew because holders asked for features in the poll.", Witness: "You saw it: the demo works. It is just not on the public site." },
    instinct: "Bench instinct: shipping slowly is not lying, but 'two weeks' four times is.",
    note: "The jury convicted on the wording, not the delay. The lead now posts dates as ranges."
  },
  {
    id: "c09", category: "Predictions", kind: "record", outcome: "not guilty",
    title: "The Quiet Rug Rumor",
    charge: "User tokenwatch_9 is accused of spreading a rumor that a project would rug by Sunday.",
    facts: "The rumor said the team would drain liquidity on Sunday. The pool was not drained.",
    exhibitA: "Prosecution: the rumor moved the price down 20% and the pool was fine all along.",
    exhibitB: "Defense: tokenwatch_9 cited a real change: the team's multisig had changed signers that week.",
    bench: { Judge: "Procedure: a rumor with a stated, checkable basis differs from one with none.", Prosecutor: "Your file: the pool stayed full. Your best point is the 20% drop.", Defender: "Your file: the multisig change was real and unannounced. The team confirmed it afterwards.", Witness: "You saw it: the team's announcement came after the post, not before." },
    instinct: "Bench instinct: a warning grounded in a real change is not the same as a lie.",
    note: "Record: the signer change was real and the team apologized for not announcing it."
  },
  {
    id: "c10", category: "Tech", kind: "jury", crowd: 45,
    title: "The Bot That Said Good Morning",
    charge: "A community member is accused of running a bot that greets every new member with a personal-sounding message.",
    facts: "New members receive a friendly welcome within seconds. Some replied thinking it was a person.",
    exhibitA: "Prosecution: people thought they were talking to a human and shared personal details.",
    exhibitB: "Defense: the welcome bot answers questions faster than any mod, and it says 'bot' in the profile.",
    bench: { Judge: "Procedure: the issue is disclosure. Did the message say it was automated?", Prosecutor: "Your file: the profile label is in small text on the third line.", Defender: "Your file: after the complaint, the greeting added 'I am a bot' and replies stayed the same.", Witness: "You saw it: nobody has complained since the greeting changed." },
    instinct: "Bench instinct: the fix was one sentence. Was the harm worth a verdict?",
    note: "The jury split almost evenly and the bot was kept, with a clearer greeting."
  },
  {
    id: "c11", category: "Memes", kind: "record", outcome: "guilty",
    title: "The Rarity Rank Wars",
    charge: "A tool maker is accused of quietly changing rarity rankings so their own holdings moved up.",
    facts: "Between two releases of a rarity tool, six of the maker's wallet's items moved into the top 100.",
    exhibitA: "Prosecution: the new formula doubles the weight of one trait that only the maker's items have.",
    exhibitB: "Defense: the change was published in the changelog and the formula is public.",
    bench: { Judge: "Procedure: a disclosed change can still be a conflict of interest.", Prosecutor: "Your file: the changelog said 'minor weight updates', without naming the trait.", Defender: "Your file: the maker has offered to let a third party review the formula.", Witness: "You saw it: the weight change was merged two days after the maker bought those items." },
    instinct: "Bench instinct: check what was bought first and what was changed second.",
    note: "Record: the maker reverted the weights and disclosed the holdings."
  },
  {
    id: "c12", category: "Drama", kind: "record", outcome: "not guilty",
    title: "The Giveaway That Picked Itself",
    charge: "Host raffle_rob is accused of rigging a giveaway after his friend won.",
    facts: "A 500-entry giveaway was won by an account that follows the host. The host streamed the draw.",
    exhibitA: "Prosecution: the winner is a friend. The odds of that happening are low.",
    exhibitB: "Defense: the draw used a public random number, and the stream shows the seed before the result.",
    bench: { Judge: "Procedure: look at whether the seed was fixed before the entries closed.", Prosecutor: "Your file: the seed was announced before the draw. That is your weakest point.", Defender: "Your file: the winner's entry was among the first 20 and counted once.", Witness: "You saw it: 14 other friends of the host also entered and none won." },
    instinct: "Bench instinct: a published seed makes a rigged result hard to hide.",
    note: "Record: anyone could rerun the draw from the seed and get the same winner."
  },
  {
    id: "c13", category: "DeFi", kind: "jury", crowd: 83,
    title: "The Leverage Influencer",
    charge: "An influencer is accused of promoting 20x leverage while quietly trading the other side.",
    facts: "A thread told followers to go long at 20x. Public data shows a short position opened an hour earlier.",
    exhibitA: "Prosecution: telling followers to buy while selling is the plainest conflict there is.",
    exhibitB: "Defense: it was a hedge on a bigger position, and the thread never claimed to be advice.",
    bench: { Judge: "Procedure: a hedge is lawful. Not saying so to the audience is the problem.", Prosecutor: "Your file: the hedge covered 10% of the stated size, so most of it was a straight short.", Defender: "Your file: the influencer disclosed the hedge in a later post, hours after.", Witness: "You saw it: the later post went up after the price had dropped." },
    instinct: "Bench instinct: late disclosure is not disclosure.",
    note: "The jury convicted heavily. The thread was deleted and replaced with an apology."
  },
  {
    id: "c14", category: "Tech", kind: "record", outcome: "not guilty",
    title: "The Midnight Contract Upgrade",
    charge: "Developer dev_nightowl is accused of upgrading a live contract at 3 a.m. to sneak in a backdoor.",
    facts: "A proxy upgrade went live at 3.02 a.m. with no announcement. Two users called it suspicious.",
    exhibitA: "Prosecution: an unannounced change at 3 a.m. is how backdoors are shipped.",
    exhibitB: "Defense: the diff is a one-line fix to a bug that was blocking withdrawals.",
    bench: { Judge: "Procedure: read the diff. Timing is a clue, not evidence.", Prosecutor: "Your file: you have no change in the diff that benefits the developer.", Defender: "Your file: a bug report from 11 p.m. shows users stuck, and the fix matches the report.", Witness: "You saw it: three auditors reviewed the diff the next morning and found nothing else." },
    instinct: "Bench instinct: the diff, not the clock, tells you what happened.",
    note: "Record: a one-line fix. The team now posts upgrade notices ahead of time."
  }
];
