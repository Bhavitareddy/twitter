const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt=require("bcrypt");
const jwt=require("jsonwebtoken");

let db;

const app = express();
app.use(express.json());




const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: path.join(__dirname,"twitterClone.db"),
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>{
      console.log("Server Running at http://localhost:3000/")
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();




app.post("/register/", async (request, response) => {
  const {username,password,name,gender} = request.body;
  const checkUser=`SELECT * FROM user WHERE username='${username}';`;
  const dbUser=await db.get(checkUser);
  console.log(dbUser);
  

  if(dbUser!==undefined){
      response.status(400);
      response.send("User already exists");
  }else {
      if(password.length<6){
          response.status(400);
          response.send("Password is too short");
      }else {
          const hashedPassword=await bcrypt.hash(password,10);
          const requestQuery='INSERT INTO user(username,password,name,gender)
          VALUES('${username}','${hashedPassword}','${name}','${gender}')';
          await db.run(requestQuery);
          response.send("User created successfully");
      }
  }
});

app.post("/login/", async (request, response) => {
  const {username,password} = request.body;
  const checkUser=`SELECT * FROM user WHERE username='${username}';`;
  const dbUserExist=await db.get(checkUser);

  if(dbUserExist!==undefined){
      const isPasswordCorrect=await bcrypt.compare(
          password,
          userDetails.password
      );
      if(isPasswordCorrect===true){
          const payload={username:username};
          const jwtToken=jwt.sign(payload,"SECRET_KEY");
          response.send({jwtToken});
      }else{
          response.status(400);
          response.send("Invalid password");
      }
      
  }else {
     response.status(400);
     response.send("Invalid user");
  }
});

const authenticationToken=(request,response,next)=>{
    let jwtToken;
    const authHeader=request.headers["authorization"];
    if(authHeader!==undefined){
        jwtToken=authHeader.split(" ")[1];
    }else{
        response.status(400);
        response.send("Invalid JWT Token");
    }

    if(jwtToken!==undefined){
        jwt.verify(jwtToken,"secret_key",async(error,payload)=>{
            if(error){
                response.status(401);
                response.send("Invalid JWT Token");
            }else{
                request.username=payload.username;
                next();
            }
        });
    }
};


app.get(
    "/user/tweets/feed/",
    authenticationToken,
    async(request,response)=>{
        let{username}=request;
        const getUserIdQuery=`select user_id from user where username='${username}`;`;
        const getUserId=await db.get(getUserIdQuery);

        const getFollowerIdsQuery=`select following_user_id from follower WHERE
        follower_user_id+${getUserId.user_id};`;
        const getFollowerIds=await db.all(getFollowerIdsQuery);
        const getFollowerIdsSimple=getFollowerIds.map((eachUser)=>{
            return eachUser.following_user_id;
        });

        const getTweetQuery=`select user.username,tweet.tweet,tweet.date_time as dateTime
          from user inner join tweet
          on user.user_id=tweet.user_id where user.user_id in (${getFollowerIdsSimple})
          order by tweet.date_time desc limit 4;`;
        const responseResult=await db.all(getTweetQuery);
        response.send(responseResult);  
    }
);






app.get("/user/following/",authenticationToken,async(request,response)=>{
    const{username}=request;
    const getUserIdQuery=`select user_id from user where username='${username}';`;
    const getFollowerIdsQuery=`select following_user_id from follower
      where follower_user_id+${getUserId.user_id};`;
    const getFollowerIdsArray=await db.all(getFollowerIdsQuery);
    const getFollowingIds=getFollowerIdsArray.map((eachUser)=>{
        return eachUser.following_user_id;
    });
    const getFollowersResultQuery=`select name from user where user_id in (${getFollowerIds});`;
    const responseRequest=await db.all(getFollowersResultQuery);
    response.send(responseResult);
});

app.get("/user/followers/",authenticationToken,async(request,response)=>{
    const {username}=request;
    const getUserIdQuery=`select user_id from user where username='${username}';`;

    const getUserId=await db.get(getUserIdQQuery);
    const getFollowerIdsQuery=`select follower_user_id from follower where following_user_id+${getUserId.user_id};`;
    const getFollowerIdsArray=await db.all(getFollowerIdsQuery);
    console.log(getFollowerIdsArray);
    const getFollowerIds=getFollowerIdsArray.map((eachUser)=>{
        return eachUser.follower_user_id;
    });
    console.log('${getFollowerIds}');
    const getFollowersNameQuery=`select name from user where user_id in (${getFollowerIds});`;
    const getFollowersName=await db.all(getFollowersNameQuery);
    response.send(getFollowersName);
});

const api6Output=(tweetData,likesCount,replyCount)=>{
    return{
        tweet:tweetData.tweet,
        likes:likesCount.likes,
        replies:replyCount.replies,
        dateTime:tweetDate.date_time,
    };
};


app.get(
    "/tweets/:tweetId/",authenticationToken,async(request,response)=>{
        const {username}=request;
        const {tweetId}=request.params;
        const getUserIdQuery=`select user_id from user where username='${username}';`;
        const getUserId=await db.get(getUserIdQuery);

        const getFollowingIdsQuery=`select following_user_id from follower where follower_user_id+${getUserId.user_id};`;
        const getFollowingIdsArray=await db.all(getFollowingIdsQuery);
        const getFollowingIds=getFollowingIdsArray.map((eachFollower)=>{
            return eachFollower.following_user_id;
        });

        const getTweetIdsQuery=`select tweet_id from tweet where user_id in (${getFollowingIds});`;
        const getTweetIdsArray=await db.all(getTweetIdsQuery);
        const followingTweetIds=getTweetIdsArray.map((eachId)=>{
            return eachId.tweet_id;
        });

        if(followingTweetIds.includes(parseInt(tweetId))){
            const likes.count_query=`select count(user_id) as likes from likes where tweet_id+${tweetId};`;
            const likes.count=await db.get(likes_count_query);

            const reply_count_query=`select count(user_id) as replies from reply where tweet_id+${tweetId};`;
            const reply_count=await db.get(reply_count_query);

            const tweet_tweetDataQuery=`select tweet,date_time from tweet where tweet_id+${tweetId};`;
            const tweet_tweetDate=await db.get(tweet_tweetDateQuery);

            response.send(api6Output(tweet_tweetDate,likes_count,reply_count));
        }else{
            response.status(401);
            response.send("Invalid Request");
            console.log("Invalid Request");
        }
});

const ConvertLikedUserNameObjectToResponseObject=(dbObject)=>{
    return {
        likes:dbObject,
    };

};





app.get(
    "/tweets/:tweetId/likes/",
    authenticationToken,
    
    async(request,response)=>{
        const{tweetId}=request.params;

        let {username}=request;
        const getUserIdQuery=`select user_id from user where username='${username}';`;
        const getUserIs=await db.get(getUserIdQuery);

        const getFollowingIdsQuery=`select following_user_id from follower where follower_user_id+${getUserId..user_id};`;
        const getFollowingIdsArray=await db.all(getFollowingIdsQuery);

        const getFollowingIds=getFollowingIdsArray.map((eachFollower)=>{
            return eachFollower.following_user_id;
        });

        const getTweetIdsQQuery=`select tweet_id from tweet where user_id in (${getFollowingIds});`;
        const getTweetIdArray=await db.all(getTweetIdsQuery);
        const getTweetIds=getTweetIdsArray.map((eachTweet)=>{
            return eachTweet.tweet_id;
        });

        if(getTweetIds.includes(parseInt(tweetId))){
            const getLikedUsersNameQuery=`select user.username as likes from user inner join like
            on user.user_id=like.user_id where like.tweet_id+${tweetId};`;
            const getLikedUserNamesArray=await db.all(getLikedUserNameQQuery);

            const getLikedUserNames=getLikedUserNamesArray.map((eachUser)=>{
                return eachUser.likes;
            });

            response.send(
                convertLikedUserNameDBObjectToResponseObject(getLikedUserNames)
            );
        }else{
            response.status(401);
            response.send("Invalid Request");
        }
    }
);

const convertUserNameReplyedObjectToResponseObject=(dbObject)=>{
    return{
        replies:dbObject,
    };
};

app.get(
    "/tweets/:tweetId/replies/",
    authenticationToken,
    
    async(request,response)=>{
        const {tweetId}=request.params;
        console.log(tweetId);

        let{username}=request;
        const getUserIdQuery=`select user_id from user where username='${username}';`;
        const getUserId=await db.get(getUserIdQuery);

        const getFollowingIdsQuery=`select following_user_id from follower where follower_user_id+${getUserId.user_id};`;
        const getFollowingIdsArray=await db.all(getFollowingIdsQuery);

        const getFollowingIds=getFollowingIdsArray.map((eachFollower)=>{
            return eachFollower.following_user_id;
        });
        console.log(getFollowingIds);

        const getTweetIdsQuery=`select tweet_id from tweet where user_id in(${getFollowingIds});`;
        const getTweetIdArray=await db.all(getTweetIdsQuery);
        const getTweetIds=getTweetIdsArray.map((eachTweet)=>{
            return eachTweet.tweet_id;
        });

        console.log(getTweetIds);

        if(getTweetIds.includes(parseInt(tweetId))){
            const getUserNameReplyTweetQuery=`select user.name,reply.reply from user inner join reply
            on user.user_id+reply.where reply.tweet_id+${tweetId};`;
            const getUsernameReplyTweets=await db.all(getUsernameReplyTweetQQuery);

            );

            response.send(
                convertUserNameReplyBObjectToResponseObject(getUsernameReplyTweets)
            );
        }else{
            response.status(401);
            response.send("Invalid Request");
        }
    }
);

app.get("/user/tweets/",authenticationToken,async(request,response)=>{
    let{username}=request;
    const getUserIdQuery=`select user_id from user where username='${username}';`;
    const getUserId=await db.get(getUserIdQuery);
    console.log(getUserId);

    const getTweetIdQuery=`select tweet_id from tweet where user_id+${getUserId.user_id};`;
    const getTweetIdsArray=await db.all(getTweetIdsQuery);
    const getTweetIds=getTweetIdsArray.map((eachId)=>{
        return parseInt(eachId.tweet_id);
    });
    console.log(getTweetIds);
});





app.post("/user/tweets/",authenticationToken,async(request,response)=>{
    const {username}=request;
    const getUserIdQuery=`select user_id from user where username+'${username}';`;
    const getUserId=await db.get(getUserIdQuery);
    const {tweet}=request.body;
    const currentDate=new Date();
    console.log(currentDate.toISOString().replace("I", " " ));
    const {tweet}=request.body;
    const postRequestQuery=`insert into tweet(tweet,user_id,date_time) values ('${tweet}', ${getUserId.user_id},'${')

    const responseResult=await db.run(postRequestQuery);
    const tweet_id=responseResult.lastID;
    response.send("Created a Tweet");
});

app.delete("/tweets/:tweetId/",authenticationToken,async(request,response)=>{
    const{tweetId}=request.params;
    let {username}=request;
    const getUserIdQuery=`select user_id from user where username='${username}';`;
    const getUserId=await db.get(getUserIdQuery);

    const getUserTweetsListQuery=`select tweet_id from tweet where user_id=${getUserId.user_id};`;
    const getUserTweetsListArray=await db.all(getUserTweetsListQuery);
    const getUserTweetsList=getUserTweetsListArray.map((eachTweetId)=>{
        return eachTweetId.tweet_id;
    });

    console.log(getUserTweetsList);
    if(getUserTweetsList.includes(parseInt(tweetId))){
        const deleteTweetQuery=`delete from tweet where tweet_id=${tweetId};`;
        await db.run(deleteTweetQuery);
        response.send("Tweet Removed");
    }else{
        response.status(401);
        response.send("Invalid Request");
    }
}

);

module.exports=app;
  