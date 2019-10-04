const truffleAssert = require('truffle-assertions');

var SupplyChain = artifacts.require('SupplyChain')

contract('SupplyChain', function(accounts) {
    
    var sku = 1
    var upc = 1
    const originFarmerID = accounts[1]
    const originFarmName = "John Doe"
    const originFarmInformation = "Yarray Valley"
    const originFarmLatitude = "-38.239770"
    const originFarmLongitude = "144.341490"
    const productNotes = "Watermelon Note"
    const productPrice = 1000000000000000000 //1 ether
    const distributorID = accounts[2]
    const retailerID = accounts[3]
    const consumerID = accounts[4]

    console.log("ganache-cli accounts used here...")
    console.log("Contract Owner: accounts[0] ", accounts[0])
    console.log("Farmer: accounts[1] ", accounts[1])
    console.log("Market: accounts[2] ", accounts[2])
    console.log("Consumer: accounts[3] ", accounts[3])

    // 1st Test
    it("Testing smart contract function harvestItem() that allows a farmer to harvest watermelon", async() => {
        const supplyChain = await SupplyChain.deployed()

        supplyChain.addFarmer(originFarmerID)
        supplyChain.addDistributor(distributorID)
        supplyChain.addRetailer(retailerID)
        supplyChain.addConsumer(consumerID)

        // Mark an item as Harvested by calling function harvestItem()
        await supplyChain.harvestItem(upc, originFarmerID, originFarmName, originFarmInformation, originFarmLatitude, originFarmLongitude, productNotes,productPrice+"",{from: originFarmerID})
        
        // Retrieve the just now saved item from blockchain by calling function fetchItem()
        const resultBufferOne = await supplyChain.fetchItemBufferOne.call(upc)
        const resultBufferTwo = await supplyChain.fetchItemBufferTwo.call(upc)

        // Verify the result set
        assert.equal(resultBufferOne[0], sku, 'Error: Invalid item SKU')
        assert.equal(resultBufferOne[1], upc, 'Error: Invalid item UPC')
        assert.equal(resultBufferOne[2], originFarmerID, 'Error: Missing or Invalid ownerID')
        assert.equal(resultBufferOne[3], originFarmerID, 'Error: Missing or Invalid originFarmerID')
        assert.equal(resultBufferOne[4], originFarmName, 'Error: Missing or Invalid originFarmName')
        assert.equal(resultBufferOne[5], originFarmInformation, 'Error: Missing or Invalid originFarmInformation')
        assert.equal(resultBufferOne[6], originFarmLatitude, 'Error: Missing or Invalid originFarmLatitude')
        assert.equal(resultBufferOne[7], originFarmLongitude, 'Error: Missing or Invalid originFarmLongitude')
        assert.equal(resultBufferTwo[5], 0, 'Error: Invalid item State')   
    })    

    // 2nd Test
    it("Testing smart contract function processItem() that allows a farmer to process watermelon", async() => {
        const supplyChain = await SupplyChain.deployed();

        await supplyChain.processItem(upc, {from: originFarmerID});
        const resultBuffer = await supplyChain.fetchItemBufferTwo.call(upc);

        assert.equal(resultBuffer[0], sku, 'Error: Invalid item SKU');
        assert.equal(resultBuffer[1], upc, 'Error: Invalid item UPC');

        //Harvested  0
        //Processed  1
        //Packed     2
        //ForSale    3
        //Sold       4
        //Shipped    5
        //Received   6
        //Purchased  7
        assert.equal(resultBuffer[5], 1, 'Error: Invalid item State');
        
    })    

    // 3rd Test
    it("Testing smart contract function packItem() that allows a farmer to pack watermelon", async() => {
        const supplyChain = await SupplyChain.deployed();

        await supplyChain.packItem(upc, {from: originFarmerID});
        const resultBuffer = await supplyChain.fetchItemBufferTwo.call(upc);

        assert.equal(resultBuffer[0], sku, 'Error: Invalid item SKU');
        assert.equal(resultBuffer[1], upc, 'Error: Invalid item UPC');
        //Harvested  0
        //Processed  1
        //Packed     2
        //ForSale    3
        //Sold       4
        //Shipped    5
        //Received   6
        //Purchased  7
        assert.equal(resultBuffer[5], 2, 'Error: Invalid item State');
    })    

    // 4th Test
    it("Testing smart contract function sellItem() that allows a farmer to sell watermelon", async() => {
        const supplyChain = await SupplyChain.deployed();

        await supplyChain.sellItem(upc,productPrice+"",{from: originFarmerID});
        const resultBuffer = await supplyChain.fetchItemBufferTwo.call(upc);

        assert.equal(resultBuffer[4], productPrice, 'Error: Invalid item price');
        //Harvested  0
        //Processed  1
        //Packed     2
        //ForSale    3
        //Sold       4
        //Shipped    5
        //Received   6
        //Purchased  7
        assert.equal(resultBuffer[5], 3, 'Error: Invalid item State');
          
    })    

    // 5th Test
    it("Testing smart contract function buyItem() that allows a distributor to buy watermelon", async() => {
        const supplyChain = await SupplyChain.deployed();

        let payAmount = 5000000000000000000
        await supplyChain.buyItem(upc, {from: distributorID, value: payAmount});

        const resultBuffer = await supplyChain.fetchItemBufferTwo.call(upc);

        assert.equal(distributorID,resultBuffer[6],"Error: Wrong MarketID")
        //Harvested  0
        //Processed  1
        //Packed     2
        //ForSale    3
        //Sold       4
        //Shipped    5
        //Received   6
        //Purchased  7
        assert.equal(resultBuffer[5], 4, 'Error: Invalid item State');
        
    })

    // 6th Test
    it("Testing smart contract function shipItem() that allows a distributor to ship watermelon", async() => {
        const supplyChain = await SupplyChain.deployed();

        await supplyChain.shipItem(upc,{from: distributorID});
        const resultBuffer = await supplyChain.fetchItemBufferTwo.call(upc);

        //Harvested  0
        //Processed  1
        //Packed     2
        //ForSale    3
        //Sold       4
        //Shipped    5
        //Received   6
        //Purchased  7
        assert.equal(resultBuffer[5], 5, 'Error: Invalid item State');
              
    }) 

    // 7th Test
    it("Testing smart contract function receiveItem() that allows a retailer to receive watermelon", async() => {
        const supplyChain = await SupplyChain.deployed();

        await supplyChain.receiveItem(upc,{from: retailerID});
        const resultBuffer = await supplyChain.fetchItemBufferTwo.call(upc);

        //Harvested  0
        //Processed  1
        //Packed     2
        //ForSale    3
        //Sold       4
        //Shipped    5
        //Received   6
        //Purchased  7
        assert.equal(resultBuffer[5], 6, 'Error: Invalid item State');
              
    }) 

    // 8th Test
    it("Testing smart contract function purchaseItem() that allows a consumer to purchase watermelon", async() => {
        const supplyChain = await SupplyChain.deployed();

        //let payAmount = 1200000000000000000
        await supplyChain.purchaseItem(upc, {from: consumerID, value: 1200000000000000000});
        const resultBuffer1 = await supplyChain.fetchItemBufferOne.call(upc);
        const resultBuffer2 = await supplyChain.fetchItemBufferTwo.call(upc);

        assert.equal(consumerID,resultBuffer1[2],"Error: Wrong ConsumerID")
        assert.equal(consumerID,resultBuffer2[8],"Error: Wrong ConsumerID")
        //Harvested  0
        //Processed  1
        //Packed     2
        //ForSale    3
        //Sold       4
        //Shipped    5
        //Received   6
        //Purchased  7
        assert.equal(resultBuffer2[5], 7, 'Error: Invalid item State');
        
    })    

    // 9th Test
    it("Testing smart contract function fetchItemBufferOne() that allows anyone to fetch item details from blockchain", async() => {
        const supplyChain = await SupplyChain.deployed()

        const resultBuffer = await supplyChain.fetchItemBufferOne.call(upc);
        
        assert.equal(resultBuffer[0],sku,"Error Wrong sku")
        assert.equal(resultBuffer[1],upc,"Error Wrong upc")
        assert.equal(resultBuffer[2],consumerID,"Error Wrong owner consumer id")
        assert.equal(resultBuffer[3],originFarmerID,"Error Wrong farm id")
        assert.equal(resultBuffer[4],originFarmName,"Error Wrong farm name")
        assert.equal(resultBuffer[5],originFarmInformation,"Error Wrong farm info")
        assert.equal(resultBuffer[6],originFarmLatitude,"Error Wrong farm latitude")
        assert.equal(resultBuffer[7],originFarmLongitude,"Error Wrong farm longtitude")
    })

    // 10th Test
    it("Testing smart contract function fetchItemBufferTwo() that allows anyone to fetch item details from blockchain", async() => {
        const supplyChain = await SupplyChain.deployed()

        const resultBuffer = await supplyChain.fetchItemBufferTwo.call(upc);
        
        assert.equal(resultBuffer[0],sku,"Error Wrong sku")
        assert.equal(resultBuffer[1],upc,"Error Wrong upc")
        assert.equal(resultBuffer[2],sku+upc,"Error Wrong owner consumer id")
        assert.equal(resultBuffer[3],productNotes,"Error Wrong notes")
        assert.equal(resultBuffer[4],productPrice,"Error Wrong product price")
        assert.equal(resultBuffer[5],7,"Error Wrong state ")
        assert.equal(resultBuffer[6],distributorID,"Error Wrong distributor")
        assert.equal(resultBuffer[7],retailerID,"Error Wrong retailer")
        assert.equal(resultBuffer[8],consumerID,"Error Wrong consumer")
    })

});
