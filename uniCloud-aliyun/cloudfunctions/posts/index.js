"use strict";

const db = uniCloud.database();
const $ = db.command.aggregate;
const _ = db.command;

exports.main = async (event, context) => {
  console.log("云函数入口:", event);

  const { action, params = {} } = event;

  try {
    let result;
    switch (action) {
      case "getPosts":
        result = await getPosts(params);
        break;
      case "getPostsByTag":
        result = await getPostsByTag(params);
        break;
      case "searchPosts":
        result = await searchPosts(params);
        break;
      case "getPostDetail":
        result = await getPostDetail(params);
        break;
      case "getRecommendedPosts":
        console.log("开始获取推荐内容, 参数:", params);
        result = await getRecommendedPosts(params);
        console.log("获取推荐内容完成, 结果:", result);
        break;
      default:
        console.error("未找到对应的操作:", action);
        return {
          code: 404,
          msg: "未找到对应的操作",
          data: null,
        };
    }

    return {
      code: 0,
      msg: "success",
      data: result,
    };
  } catch (error) {
    console.error("云函数执行错误:", error);
    return {
      code: 500,
      msg: error.message || "服务器错误",
      data: null,
    };
  }
};

// 获取帖子列表
async function getPosts({ category = "all", page = 1, pageSize = 10 }) {
  const collection = db.collection("posts");
  const skipAmount = (page - 1) * pageSize;

  try {
    let matchStage = {
      status: 1, // 只查询已发布的帖子
    };

    // 根据分类筛选
    if (category !== "all" && category !== "hot" && category !== "new") {
      matchStage.category = category;
    }

    let query = collection
      .aggregate()
      .match(matchStage)
      .lookup({
        from: "uni-id-users",
        localField: "user_id",
        foreignField: "_id",
        as: "author",
      })
      .unwind({
        path: "$author",
        preserveNullAndEmptyArrays: true,
      })
      .project({
        _id: 1,
        title: 1,
        description: 1,
        images: 1,
        cover: {
          $cond: {
            if: { $gt: [{ $size: "$images" }, 0] },
            then: { $arrayElemAt: ["$images", 0] },
            else: null,
          },
        },
        category: 1,
        likeCount: { $ifNull: ["$likeCount", 0] },
        commentCount: { $ifNull: ["$commentCount", 0] },
        collectCount: { $ifNull: ["$collectCount", 0] },
        create_date: 1,
        "author._id": 1,
        "author.nickname": 1,
        "author.avatar": 1,
      });

    // 排序逻辑
    switch (category) {
      case "hot":
        // 热门：综合考虑点赞数、评论数和收藏数
        query = query
          .addFields({
            hotScore: {
              $add: [
                { $multiply: ["$likeCount", 2] }, // 点赞权重 2
                { $multiply: ["$commentCount", 3] }, // 评论权重 3
                { $multiply: ["$collectCount", 2] }, // 收藏权重 2
              ],
            },
          })
          .sort({
            hotScore: -1,
            create_date: -1,
          });
        break;
      case "new":
        // 最新：纯按创建时间
        query = query.sort({
          create_date: -1,
        });
        break;
      default:
        // 其他分类：优先展示热度高的
        query = query.sort({
          likeCount: -1,
          commentCount: -1,
          create_date: -1,
        });
    }

    const list = await query.skip(skipAmount).limit(pageSize).end();
    console.log("查询结果:", list.data);

    // 格式化数据
    const formattedList = list.data.map((item) => ({
      _id: item._id,
      title: item.title || "",
      description: item.description || "",
      images: item.images || [],
      cover: item.cover || (item.images && item.images[0]) || null,
      category: item.category || "other",
      likes: item.likeCount || 0,
      comments: item.commentCount || 0,
      collects: item.collectCount || 0,
      create_date: item.create_date,
      author: {
        _id: item.author ? item.author._id : "",
        nickname: item.author ? item.author.nickname : "未知用户",
        avatar: item.author ? item.author.avatar : null,
      },
    }));

    console.log("格式化后的数据:", formattedList);
    return formattedList;
  } catch (error) {
    console.error("获取帖子列表失败:", error);
    throw new Error("获取帖子列表失败");
  }
}

// 根据标签获取帖子
async function getPostsByTag({ tag, page = 1, pageSize = 10 }) {
  const collection = db.collection("posts");
  const skipAmount = (page - 1) * pageSize;

  try {
    const list = await collection
      .aggregate()
      .match({
        tags: tag,
      })
      .lookup({
        from: "uni-id-users",
        localField: "user_id",
        foreignField: "_id",
        as: "author",
      })
      .unwind({
        path: "$author",
        preserveNullAndEmptyArrays: true,
      })
      .project({
        _id: 1,
        title: 1,
        description: 1,
        cover: "$images[0]",
        images: 1,
        tags: 1,
        likeCount: 1,
        commentCount: 1,
        collectCount: 1,
        create_date: 1,
        "author._id": 1,
        "author.nickname": 1,
        "author.avatar": 1,
      })
      .sort({
        create_date: -1,
      })
      .skip(skipAmount)
      .limit(pageSize)
      .end();

    return list.data || [];
  } catch (error) {
    console.error("获取标签帖子失败:", error);
    throw new Error("获取标签帖子失败");
  }
}

// 搜索帖子
async function searchPosts({ keyword, page = 1, pageSize = 10 }) {
  const collection = db.collection("posts");
  const skipAmount = (page - 1) * pageSize;

  try {
    const list = await collection
      .aggregate()
      .match({
        $or: [
          {
            title: new RegExp(keyword, "i"),
          },
          {
            description: new RegExp(keyword, "i"),
          },
          {
            tags: keyword,
          },
        ],
      })
      .lookup({
        from: "uni-id-users",
        localField: "user_id",
        foreignField: "_id",
        as: "author",
      })
      .unwind({
        path: "$author",
        preserveNullAndEmptyArrays: true,
      })
      .project({
        _id: 1,
        title: 1,
        description: 1,
        cover: "$images[0]",
        images: 1,
        tags: 1,
        likeCount: 1,
        commentCount: 1,
        collectCount: 1,
        create_date: 1,
        "author._id": 1,
        "author.nickname": 1,
        "author.avatar": 1,
      })
      .sort({
        create_date: -1,
      })
      .skip(skipAmount)
      .limit(pageSize)
      .end();

    return list.data || [];
  } catch (error) {
    console.error("搜索帖子失败:", error);
    throw new Error("搜索帖子失败");
  }
}

// 获取帖子详情
async function getPostDetail({ postId }) {
  if (!postId) {
    throw new Error("帖子ID不能为空");
  }

  const collection = db.collection("posts");

  try {
    const result = await collection
      .aggregate()
      .match({
        _id: postId,
      })
      .lookup({
        from: "uni-id-users",
        localField: "user_id",
        foreignField: "_id",
        as: "author",
      })
      .unwind({
        path: "$author",
        preserveNullAndEmptyArrays: true,
      })
      .project({
        _id: 1,
        title: 1,
        content: 1,
        description: 1,
        images: 1,
        tags: 1,
        category: 1,
        likeCount: 1,
        commentCount: 1,
        collectCount: 1,
        create_date: 1,
        update_date: 1,
        "author._id": 1,
        "author.nickname": 1,
        "author.avatar": 1,
      })
      .end();

    if (!result.data || result.data.length === 0) {
      throw new Error("帖子不存在");
    }

    return result.data[0];
  } catch (error) {
    console.error("获取帖子详情失败:", error);
    throw new Error(error.message || "获取帖子详情失败");
  }
}

// 获取推荐内容
async function getRecommendedPosts({ page = 1, pageSize = 10 }) {
  const skipAmount = (page - 1) * pageSize;

  try {
    const collection = db.collection("posts");
    const list = await collection
      .aggregate()
      .match({
        status: 1,
      })
      .lookup({
        from: "uni-id-users",
        localField: "user_id",
        foreignField: "_id",
        as: "author",
      })
      .unwind({
        path: "$author",
        preserveNullAndEmptyArrays: true,
      })
      .project({
        _id: 1,
        title: 1,
        description: 1,
        images: 1,
        cover: {
          $cond: {
            if: { $gt: [{ $size: "$images" }, 0] },
            then: { $arrayElemAt: ["$images", 0] },
            else: null,
          },
        },
        category: 1,
        likeCount: { $ifNull: ["$likeCount", 0] },
        commentCount: { $ifNull: ["$commentCount", 0] },
        collectCount: { $ifNull: ["$collectCount", 0] },
        create_date: 1,
        "author._id": 1,
        "author.nickname": 1,
        "author.avatar": 1,
      })
      .sort({
        create_date: -1,
      })
      .skip(skipAmount)
      .limit(pageSize)
      .end();

    // 添加一些测试数据
    if (!list.data || list.data.length === 0) {
      return [
        {
          _id: "1",
          title: "测试美食1",
          description: "这是一个测试美食描述",
          cover:
            "https://vkceyugu.cdn.bspapp.com/VKCEYUGU-f184e7c3-1912-41b2-b81f-435d1b37c7b4/1ae87107-d76b-4a15-914d-614e8e84148a.jpg",
          likes: 100,
          comments: 50,
          author: {
            _id: "1",
            nickname: "测试用户",
            avatar:
              "https://vkceyugu.cdn.bspapp.com/VKCEYUGU-f184e7c3-1912-41b2-b81f-435d1b37c7b4/1ae87107-d76b-4a15-914d-614e8e84148a.jpg",
          },
        },
        {
          _id: "2",
          title: "测试美食2",
          description: "这是另一个测试美食描述",
          cover:
            "https://vkceyugu.cdn.bspapp.com/VKCEYUGU-f184e7c3-1912-41b2-b81f-435d1b37c7b4/1ae87107-d76b-4a15-914d-614e8e84148a.jpg",
          likes: 200,
          comments: 80,
          author: {
            _id: "2",
            nickname: "测试用户2",
            avatar:
              "https://vkceyugu.cdn.bspapp.com/VKCEYUGU-f184e7c3-1912-41b2-b81f-435d1b37c7b4/1ae87107-d76b-4a15-914d-614e8e84148a.jpg",
          },
        },
      ];
    }

    return formatPostList(list.data);
  } catch (error) {
    console.error("获取推荐内容失败:", error);
    throw new Error("获取推荐内容失败");
  }
}

// 格式化帖子列表数据
function formatPostList(list) {
  return list.map((item) => ({
    _id: item._id,
    title: item.title || "",
    description: item.description || "",
    images: item.images || [],
    cover: item.cover || (item.images && item.images[0]) || null,
    category: item.category || "other",
    likes: item.likeCount || 0,
    comments: item.commentCount || 0,
    collects: item.collectCount || 0,
    create_date: item.create_date,
    author: {
      _id: item.author ? item.author._id : "",
      nickname: item.author ? item.author.nickname : "未知用户",
      avatar: item.author ? item.author.avatar : null,
    },
  }));
}
