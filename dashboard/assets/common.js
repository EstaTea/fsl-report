$(function() {
    // 变量声明
    let p = 0;
    let t = 0;
    let scrollTimeout;

    // AOS初始化
    AOS.init({
        offset: 150,
        duration: 800,
        once: true,
        mirror: false,
        anchorPlacement: 'top-center',
        easing: 'ease-out-quad',
        disable: () => window.innerWidth <= 1024
    });


    //锚点跳转滑动效果  
    $('a.ph').click(function() {
        $('a.ph').removeClass("on")
        $(this).addClass("on")
        if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') && location.hostname == this.hostname) {
            var $target = $(this.hash);
            $target = $target.length && $target || $('[id=' + this.hash.slice(1) + ']');
            if ($target.length) {
                var targetOffset = $target.offset().top;
                $('html,body').animate({
                    scrollTop: targetOffset + 0 + "px"
                }, 500);
                return false;
            }
        }
    });

    $(".header .ul .li").hover(function() {
        $(this).find(".lv2list").stop().slideDown()
    }, function() {
        $(this).find(".lv2list").stop().slideUp()
    })

    $(".header .ul .li .lv2list .plxl .left a").hover(function() {
        $(this).addClass("on").siblings().removeClass("on")
        var index = $(this).index()
        $(".header .ul .li .lv2list .plxl .right .con1").eq(index).addClass("on").siblings().removeClass("on")
    })

    // 滚动事件
    function handleScrollLogic() {
        const p = $(window).scrollTop();
        const w = $(window).width();
        const h = window.innerHeight * 0.5;
        const $sidebar = $('.fix');
        const $header = $('.header');
        const $headerlv2 = $('.header_lv2');
        const $mHeader = $('.m_header');

        // 侧边栏逻辑
        if ($sidebar.length) {
            if (p > h) $sidebar.addClass('act');
            else if (p < h) $sidebar.removeClass('act');
        }

        // 头部逻辑
        if (t <= p && p > 10) {
            $header.addClass('on');
            $mHeader.addClass('on');
        } else if (t > p && p < 10) {
            $header.removeClass('on');
            $mHeader.removeClass('on');
        }

        if ($headerlv2.length) {
            if (p > 10) {
                $header.addClass('scrollon');
                $headerlv2.addClass('scrollon');
            } else {
                $header.removeClass('scrollon');
                $headerlv2.removeClass('scrollon');
            }
        } else {
            if (t <= p && p > 10) {
                $header.addClass('scrollon');
                $mHeader.addClass('scrollon');
            } else if (t > p) {
                $header.removeClass('scrollon');
                $mHeader.removeClass('scrollon');
            }
        }

        t = p; // 更新上一次滚动位置
    }

    // 优化事件绑定
    $(window).on('scroll', function() {
        // clearTimeout(scrollTimeout);
        // scrollTimeout = setTimeout(handleScrollLogic, 100);
        handleScrollLogic();
    });

    // 初始加载时强制执行
    $(window).on('load', function() {
        handleScrollLogic(); // 立即执行一次
        $(window).trigger('scroll'); // 确保防抖逻辑也触发
    });

    // 兼容性：若load事件已错过，直接初始化
    if (document.readyState === 'complete') {
        handleScrollLogic();
    }

    // 弹框控制
    $('body').on('click', '.popbox .close', function() {
        $(this).closest('.popbox').fadeOut();
    });

    $('body').on('click', '.video_pop .vbtn', function() {
        const $popup = $(this).closest('.video_pop');
        $popup.find('video').trigger('pause');
        $popup.fadeOut();
    });

    // 响应式导航
    const initMobileNav = () => {
        if ($(window).width() >= 1024) return;

        $(".m_header .menu").click(function(){
    		$(".mh_nav").addClass("show")
    	})
    	
    	$(".mh_nav .close").click(function(){
    		$(".mh_nav").removeClass("show")
    	})
    	
    	$(".mh_nav .nav>li").click(function(){
    		if($(this).hasClass("on")){
    			$(this).removeClass("on")
    			$(this).find(".nav2").stop().slideUp()
    		}else{
    			$(this).addClass("on")
    			$(this).find(".nav2").stop().slideDown()
    		}
    	})
    };
    initMobileNav();

    // 窗口大小变化时重新初始化移动导航
    $(window).on('resize', initMobileNav);

    // 回到顶部
    $('.back').on('click', function(e) {
        e.preventDefault();
        if ('scrollBehavior' in document.documentElement.style) {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        } else {
            $('html, body').animate({
                scrollTop: 0
            }, 500);
        }
    });
});

// 处理窗口大小变化时禁用过渡效果
function handleResizeTransitions() {
    const html = document.documentElement;
    let resizeTimer;

    // 窗口大小变化时
    window.addEventListener('resize', () => {
        // 添加禁用过渡的类
        html.classList.add('disable-transitions');

        // 清除之前的定时器
        clearTimeout(resizeTimer);

        // 延迟移除禁用过渡的类，确保尺寸变化完成
        resizeTimer = setTimeout(() => {
            html.classList.remove('disable-transitions');
        }, 100); // 100ms延迟足够大多数浏览器完成重排
    });
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    handleResizeTransitions();
});

// 平滑滚动插件初始化
SmoothScroll({
    ignore: '.scroll', //排除内部元素滚动
    animationTime: 600,
    stepSize: 100,
    accelerationDelta: 30,
    accelerationMax: 3,
    keyboardSupport: true,
    arrowScroll: 100,
    pulseAlgorithm: true,
    pulseScale: 4,
    pulseNormalize: 1,
    touchpadSupport: true
});