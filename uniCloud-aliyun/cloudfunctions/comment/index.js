"use strict";

const db = uniCloud.database();
const $ = db.command.aggregate;
const _ = db.command;

exports.main = async (event, context) => {
  switch (event.action) {
    case "create":
      return await createComment(event.params);
    case "getList":
      return await getCommentList(event.params);
    case "delete":
      return await deleteComment(event.params);
    default:
      return {
        code: 404,
        msg: "未找到对应的操作",
      };
  }
};

// 创建评论
async function createComment(params) {
  try {
    const { post_id, user_id, content } = params;

    if (!post_id || !user_id || !content) {
      return {
        code: -1,
        msg: "参数不完整",
      };
    }

    // 获取用户信息
    const userInfo = await db.collection("users").doc(user_id).get();
    if (!userInfo.data || !userInfo.data[0]) {
      return {
        code: -1,
        msg: "用户不存在",
      };
    }

    // 获取帖子信息
    const postInfo = await db.collection("posts").doc(post_id).get();
    if (!postInfo.data || !postInfo.data[0]) {
      return {
        code: -1,
        msg: "帖子不存在",
      };
    }

    // 创建评论
    const commentData = {
      post_id,
      user_id,
      content,
      create_date: new Date(),
      update_date: new Date(),
    };

    const result = await db.collection("comments").add(commentData);

    // 更新帖子的评论数
    await db
      .collection("posts")
      .doc(post_id)
      .update({
        comment_count: _.inc(1),
        update_date: new Date(),
      });

    return {
      code: 0,
      msg: "评论成功",
      data: {
        _id: result.id,
        ...commentData,
      },
    };
  } catch (error) {
    console.error("创建评论失败:", error);
    return {
      code: -1,
      msg: error.message || "创建评论失败",
    };
  }
}

// 获取评论列表
async function getCommentList(params) {
  try {
    const { postId, page = 1, pageSize = 20 } = params;

    if (!postId) {
      return {
        code: -1,
        msg: "参数不完整",
      };
    }

    const list = await db
      .collection("comments")
      .aggregate()
      .match({
        post_id: postId,
      })
      .lookup({
        from: "users",
        localField: "user_id",
        foreignField: "_id",
        as: "user",
      })
      .project({
        _id: 1,
        content: 1,
        create_date: 1,
        user: $.arrayElemAt(["$user", 0]),
      })
      .sort({
        create_date: -1,
      })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .end();

    return {
      code: 0,
      msg: "获取成功",
      data: list.data,
    };
  } catch (error) {
    console.error("获取评论列表失败:", error);
    return {
      code: -1,
      msg: error.message || "获取评论列表失败",
    };
  }
}

// 删除评论
async function deleteComment(params) {
  try {
    const { commentId, userId } = params;

    if (!commentId || !userId) {
      return {
        code: -1,
        msg: "参数不完整",
      };
    }

    // 获取评论信息
    const commentInfo = await db.collection("comments").doc(commentId).get();
    if (!commentInfo.data || !commentInfo.data[0]) {
      return {
        code: -1,
        msg: "评论不存在",
      };
    }

    // 检查是否是评论作者
    if (commentInfo.data[0].user_id !== userId) {
      return {
        code: -1,
        msg: "无权删除该评论",
      };
    }

    // 删除评论
    await db.collection("comments").doc(commentId).remove();

    // 更新帖子的评论数
    await db
      .collection("posts")
      .doc(commentInfo.data[0].post_id)
      .update({
        comment_count: _.inc(-1),
        update_date: new Date(),
      });

    return {
      code: 0,
      msg: "删除成功",
    };
  } catch (error) {
    console.error("删除评论失败:", error);
    return {
      code: -1,
      msg: error.message || "删除评论失败",
    };
  }
}
