import { expect } from "chai";
import { ethers, upgrades } from "hardhat";

describe("Adpay contract", function () {
  let owner: any,
    Adpay: any,
    creater: any,
    publisher: any,
    bidder: any,
    bidder1: any,
    bidder2: any;

  before("init", async () => {
    [owner, creater, publisher, bidder, bidder1, bidder2] =
      await ethers.getSigners();
  });

  beforeEach(async function () {
    const ad = await ethers.getContractFactory("Adpay");

    Adpay = await upgrades.deployProxy(ad, [], {
      initializer: "initialize",
    });
    await Adpay.grantRole(await Adpay.PUBLISHER_ROLE(), publisher.address);
    await Adpay.grantRole(await Adpay.ADVERTISER_ROLE(), bidder.address);
  });

  describe("Ad publish", function () {
    it("Ad published", async function () {
      let adId = "ABC123";
      let adCreator = creater.address;
      let creatorShare = 10;
      let minimumBidPrice = ethers.utils.parseUnits("1");
      await expect(
        await Adpay.connect(publisher).adPublish(
          adId,
          adCreator,
          creatorShare,
          minimumBidPrice
        )
      )
        .to.emit(Adpay, "AdPublished")
        .withArgs(adId);
    });

    it("Revert: Ad can only be published by account having publisher role", async function () {
      let adId = "ABC124";
      let adCreator = creater.address;
      let creatorShare = 10;
      let minimumBidPrice = ethers.utils.parseUnits("1");
      const role = await Adpay.PUBLISHER_ROLE();

      await expect(
        Adpay.connect(creater).adPublish(
          adId,
          adCreator,
          creatorShare,
          minimumBidPrice
        )
      ).to.be.revertedWith(
        `AccessControl: account ${creater.address.toLowerCase()} is missing role ${role}`
      );
    });

    it("Revert: Duplicate AdID", async function () {
      let adId = "ABC123";
      let adCreator = creater.address;
      let creatorShare = 10;
      let minimumBidPrice = ethers.utils.parseUnits("1");

      await Adpay.connect(publisher).adPublish(
        adId,
        adCreator,
        creatorShare,
        minimumBidPrice
      );

      await expect(
        Adpay.connect(publisher).adPublish(
          adId,
          adCreator,
          creatorShare,
          minimumBidPrice
        )
      ).to.be.revertedWith(`AdId already exist`);
    });
  });

  describe("Bid", function () {
    it("Bid on Ad", async function () {
      let adId = "ABC123";
      let adCreator = creater.address;
      let creatorShare = 10;
      let minimumBidPrice = ethers.utils.parseUnits("1");

      await expect(
        await Adpay.connect(publisher).adPublish(
          adId,
          adCreator,
          creatorShare,
          minimumBidPrice
        )
      )
        .to.emit(Adpay, "AdPublished")
        .withArgs(adId);

      await expect(
        await Adpay.connect(bidder).adBid(adId, 5, {
          value: ethers.utils.parseUnits("2"),
        })
      )
        .to.emit(Adpay, "AdBid")
        .withArgs(adId, bidder.address);
    });

    it("Revert: Ad can only be bid by account having bidder role", async function () {
      let adId = "ABC123";
      let adCreator = creater.address;
      let creatorShare = 10;
      let minimumBidPrice = ethers.utils.parseUnits("1");

      await expect(
        await Adpay.connect(publisher).adPublish(
          adId,
          adCreator,
          creatorShare,
          minimumBidPrice
        )
      )
        .to.emit(Adpay, "AdPublished")
        .withArgs(adId);
      const role = await Adpay.ADVERTISER_ROLE();
      await expect(
        Adpay.connect(creater).adBid(adId, 5, {
          value: ethers.utils.parseUnits("2"),
        })
      ).to.be.revertedWith(
        `AccessControl: account ${creater.address.toLowerCase()} is missing role ${role}`
      );
    });
    it("Revert: Lower or equal of last bid not allowed", async function () {
      let adId = "ABC123";
      let adCreator = creater.address;
      let creatorShare = 10;
      let minimumBidPrice = ethers.utils.parseUnits("1");

      await expect(
        await Adpay.connect(publisher).adPublish(
          adId,
          adCreator,
          creatorShare,
          minimumBidPrice
        )
      )
        .to.emit(Adpay, "AdPublished")
        .withArgs(adId);

      await Adpay.connect(bidder).adBid(adId, 5, {
        value: ethers.utils.parseUnits("2"),
      });
      await Adpay.connect(bidder).adBid(adId, 5, {
        value: ethers.utils.parseUnits("3"),
      });
      await expect(
        Adpay.connect(bidder).adBid(adId, 5, {
          value: ethers.utils.parseUnits("3"),
        })
      ).to.be.revertedWith(`The bid amount is less than last bid`);
    });
  });

  describe("Ad Settle", function () {
    it("Ad Settled", async function () {
      await Adpay.grantRole(await Adpay.ADVERTISER_ROLE(), bidder1.address);
      await Adpay.grantRole(await Adpay.ADVERTISER_ROLE(), bidder2.address);

      await Adpay.connect(publisher).adPublish(
        "ABC123",
        creater.address,
        10,
        ethers.utils.parseUnits("1")
      );

      await Adpay.connect(bidder).adBid("ABC123", 2, {
        value: ethers.utils.parseUnits("2"),
      });
      await Adpay.connect(bidder1).adBid("ABC123", 2, {
        value: ethers.utils.parseUnits("3"),
      });
      await Adpay.connect(bidder2).adBid("ABC123", 2, {
        value: ethers.utils.parseUnits("4"),
      });

      //settle ad
      await Adpay.connect(owner).adSettle("ABC123");

      expect(await Adpay.getBalance(publisher.address)).to.equal(
        ethers.utils.parseUnits("3.2")
      );
      expect(await Adpay.getBalance(creater.address)).to.equal(
        ethers.utils.parseUnits("0.4")
      );
    });
  });

  describe("Withdraw", function () {
    it("Creater withdraw", async function () {
      await Adpay.connect(publisher).adPublish(
        "ABC123",
        creater.address,
        10,
        ethers.utils.parseUnits("1")
      );

      await Adpay.connect(bidder).adBid("ABC123", 5, {
        value: ethers.utils.parseUnits("4"),
      });

      await Adpay.connect(owner).adSettle("ABC123");

      expect(await Adpay.getBalance(creater.address)).to.equal(
        ethers.utils.parseUnits("0.4")
      );
      const tx = await Adpay.connect(creater).withdraw();
      await expect(tx).to.changeEtherBalance(
        creater.address,
        ethers.utils.parseUnits("0.4")
      );
    });
  });
});
